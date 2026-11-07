"""Optional browser smoke test: pip install playwright && playwright install chromium.
This is not run by GitHub Actions; the Node learning-engine test is the CI baseline.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
    kwargs={'headless':True}
    if shutil.which('chromium'):kwargs['executable_path']=shutil.which('chromium')
    browser=pw.chromium.launch(**kwargs)
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror',lambda exc:errors.append(str(exc)))
    page.set_content((root/'index.html').read_text(encoding='utf-8'),wait_until='load')
    assert page.evaluate('CampusLearning.VERSION') == '0.8.0'
    assert page.locator('#enterGame').is_visible()
    page.locator('#enterGame').click()
    assert page.locator('#quizChoices button').count()==4
    print('PASS: load, first quiz, learning-engine')
    assert errors==[],errors
    browser.close()
