#!/usr/bin/env python3
import json, math, os, time
from datetime import datetime, timezone, timedelta
from urllib.request import Request, urlopen
from urllib.parse import quote

ROOT=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(ROOT,'data.json')
UA='pump-hype-dashboard/2.0 (+github-pages)'

def get_json(url, tries=3):
    last=None
    for i in range(tries):
        try:
            req=Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
            with urlopen(req,timeout=30) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:
            last=e
            time.sleep(1.5*(i+1))
    raise last

def iso_date_ms(ms):
    return datetime.fromtimestamp(ms/1000,tz=timezone.utc).date().isoformat()

def iso_date_s(sec):
    return datetime.fromtimestamp(sec,tz=timezone.utc).date().isoformat()

def finite(v):
    try:
        x=float(v)
        return x if math.isfinite(x) else None
    except Exception:
        return None

def parse_chart(obj):
    rows=obj.get('totalDataChart') if isinstance(obj,dict) else None
    out={}
    if not isinstance(rows,list): return out
    for item in rows:
        if not isinstance(item,list) or len(item)<2: continue
        ts=finite(item[0]); val=item[1]
        if isinstance(val,dict):
            val=sum(finite(v) or 0 for v in val.values())
        val=finite(val)
        if ts is None or val is None: continue
        out[iso_date_s(ts)]=val
    return out

def llama(slugs, dtype):
    err=None
    for slug in slugs:
        try:
            return get_json('https://api.llama.fi/summary/fees/'+quote(slug,safe='')+'?dataType='+quote(dtype))
        except Exception as e:
            err=e
    raise err or RuntimeError('no llama slug')

def sum_window(mp, day, n=30):
    d=datetime.fromisoformat(day).date()
    return sum(mp.get((d-timedelta(days=i)).isoformat(),0.0) for i in range(n))

def quarter_label(day):
    d=datetime.fromisoformat(day).date(); q=(d.month-1)//3+1
    return f'Q{q} {d.year}'

def safe_ratio(a,b):
    a=finite(a); b=finite(b)
    return a/b if a is not None and b not in (None,0) else None

def main():
    markets=get_json('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=pump-fun%2Chyperliquid&price_change_percentage=24h%2C7d%2C30d')
    byid={x.get('id'):x for x in markets}
    p0=byid['pump-fun']; h0=byid['hyperliquid']
    pchart=get_json('https://api.coingecko.com/api/v3/coins/pump-fun/market_chart?vs_currency=usd&days=365')
    hchart=get_json('https://api.coingecko.com/api/v3/coins/hyperliquid/market_chart?vs_currency=usd&days=365')
    pr=parse_chart(llama(['pump.fun','pump','pumpdotfun'],'dailyRevenue'))
    hr=parse_chart(llama(['hyperliquid','hyperliquid-perps'],'dailyRevenue'))
    pb=parse_chart(llama(['pump.fun','pump','pumpdotfun'],'dailyHoldersRevenue'))
    hb=parse_chart(llama(['hyperliquid','hyperliquid-perps'],'dailyHoldersRevenue'))

    def chart_maps(o):
        prices={iso_date_ms(x[0]):finite(x[1]) for x in o.get('prices',[]) if len(x)>=2}
        mcs={iso_date_ms(x[0]):finite(x[1]) for x in o.get('market_caps',[]) if len(x)>=2}
        return prices,mcs
    pp,pmc=chart_maps(pchart); hp,hmc=chart_maps(hchart)
    dates=sorted(set(pp)&set(hp)&set(pmc)&set(hmc))
    if not dates: raise RuntimeError('no aligned CoinGecko history')

    p_supply=finite(p0.get('total_supply')) or safe_ratio(p0.get('fully_diluted_valuation'),p0.get('current_price')) or 1e12
    h_supply=finite(h0.get('total_supply')) or safe_ratio(h0.get('fully_diluted_valuation'),h0.get('current_price')) or 1e9
    first_rev=min([d for d in pr.keys()] or dates)
    history=[]
    def qtd(mp, day):
        q=quarter_label(day)
        return sum(v for dd,v in mp.items() if dd<=day and quarter_label(dd)==q)
    for d in dates:
        p_price=pp[d]; h_price=hp[d]; p_mc=pmc[d]; h_mc=hmc[d]
        p_rev30=sum_window(pr,d,30); h_rev30=sum_window(hr,d,30); p_buy30=sum_window(pb,d,30); h_buy30=sum_window(hb,d,30)
        enough=(datetime.fromisoformat(d).date()-datetime.fromisoformat(first_rev).date()).days>=29
        p_fdv=p_price*p_supply if p_price is not None else None; h_fdv=h_price*h_supply if h_price is not None else None
        p_fdr=safe_ratio(p_fdv,p_rev30*12) if enough and p_rev30>0 else None
        h_fdr=safe_ratio(h_fdv,h_rev30*12) if enough and h_rev30>0 else None
        p_y=(p_buy30*12/p_mc*100) if enough and p_mc and p_buy30>=0 else None
        h_y=(h_buy30*12/h_mc*100) if enough and h_mc and h_buy30>=0 else None
        p_qr,p_qb,h_qr,h_qb=qtd(pr,d),qtd(pb,d),qtd(hr,d),qtd(hb,d)
        p_q=safe_ratio(p_qb*100,p_qr); h_q=safe_ratio(h_qb*100,h_qr)
        history.append({
            'date':d,
            'p_price':p_price,'h_price':h_price,'p_mc':p_mc,'h_mc':h_mc,
            'price_ratio':safe_ratio(h_price,p_price),'mc_ratio':safe_ratio(h_mc,p_mc),
            'p_rev30':p_rev30 if enough else None,'h_rev30':h_rev30 if enough else None,
            'revenue_ratio':safe_ratio(h_rev30,p_rev30) if enough else None,
            'p_buy30':p_buy30 if enough else None,'h_buy30':h_buy30 if enough else None,
            'p_fdv_rev':p_fdr,'h_fdv_rev':h_fdr,'fdvrev_ratio':safe_ratio(h_fdr,p_fdr),
            'p_buyback_yield':p_y,'h_buyback_yield':h_y,'yield_ratio':safe_ratio(h_y,p_y),
            'p_q_conv':p_q,'h_q_conv':h_q
        })

    qkeys=sorted(set(quarter_label(d) for d in set(pr)|set(hr)|set(pb)|set(hb)),key=lambda s:(int(s.split()[1]),int(s[1])))
    quarters=[]; today=datetime.now(timezone.utc).date(); current_q=f'Q{(today.month-1)//3+1} {today.year}'
    for q in qkeys:
        def qsum(mp): return sum(v for d,v in mp.items() if quarter_label(d)==q)
        prq,pbq,hrq,hbq=qsum(pr),qsum(pb),qsum(hr),qsum(hb)
        if prq==0 and hrq==0: continue
        quarters.append({'label':q,'pump_revenue':prq,'pump_buyback':pbq,'pump_conversion':safe_ratio(pbq*100,prq),'hype_revenue':hrq,'hype_buyback':hbq,'hype_conversion':safe_ratio(hbq*100,hrq),'partial':q==current_q})
    quarters=quarters[-8:]

    p_rev30=sum_window(pr,dates[-1],30);h_rev30=sum_window(hr,dates[-1],30);p_buy30=sum_window(pb,dates[-1],30);h_buy30=sum_window(hb,dates[-1],30)
    pfdv=finite(p0.get('fully_diluted_valuation')) or (finite(p0.get('current_price'))*p_supply);hfdv=finite(h0.get('fully_diluted_valuation')) or (finite(h0.get('current_price'))*h_supply)
    pm=finite(p0.get('market_cap'));hm=finite(h0.get('market_cap'))
    current={'pump':{'price':finite(p0.get('current_price')),'market_cap':pm,'fdv':pfdv,'revenue_30d':p_rev30,'buyback_30d':p_buy30,'fdv_revenue':safe_ratio(pfdv,p_rev30*12),'buyback_yield':(p_buy30*12/pm*100 if pm else None),'total_supply':p_supply},'hype':{'price':finite(h0.get('current_price')),'market_cap':hm,'fdv':hfdv,'revenue_30d':h_rev30,'buyback_30d':h_buy30,'fdv_revenue':safe_ratio(hfdv,h_rev30*12),'buyback_yield':(h_buy30*12/hm*100 if hm else None),'total_supply':h_supply}}
    payload={'generated_at':datetime.now(timezone.utc).isoformat(),'version':2,'denominator':'PUMP','sources':{'market':'CoinGecko','fundamentals':'DefiLlama'},'current':current,'history':history,'quarters':quarters}
    with open(OUT,'w',encoding='utf-8') as f: json.dump(payload,f,ensure_ascii=False,separators=(',',':'))
    print('wrote',OUT,'history',len(history),'quarters',len(quarters))
if __name__=='__main__': main()
