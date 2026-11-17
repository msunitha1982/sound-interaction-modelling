from playwright.sync_api import sync_playwright
import json
import tempfile
# Requires an existing Python Playwright and Chromium installation.
# Start the app on port 3000, then run python3 tests/stage4-browser.py.
out=tempfile.mkdtemp(prefix='sound-stage4-')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1366,'height':768})
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:3000/#4')
    page.evaluate('''()=>{window.audioCalls=[];for(const name of ['startVoice','clap','stopAll']){const original=SoundSim.audio[name];SoundSim.audio[name]=function(opts){audioCalls.push({name,opts});return original(opts);};}}''')
    def slider(scene,name,value):
        scene.get_by_role('slider',name=name,exact=True).evaluate('(e,v)=>{e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}));}',value)
    def record(scene,label):
        scene.get_by_role('group',name='Prediction',exact=True).get_by_label(label,exact=True).check()
        scene.get_by_role('button',name='Record prediction',exact=True).click()
    s=page.locator('#scene-4')
    assert s.locator('.caption-bar').evaluate('(e)=>getComputedStyle(e).visibility')=='hidden'
    s.get_by_role('button',name='Sound: Off',exact=True).click()
    slider(s,'Frequency',150);slider(s,'Frequency',2000)
    assert page.evaluate('audioCalls.find(c=>c.name==="startVoice").opts.type')=='sawtooth'
    assert not s.locator('.think-result').is_visible(), 'must predict first'
    record(s,'It gets quieter.')
    slider(s,'Frequency',150)
    assert s.locator('.think-result').is_visible()
    assert 'At 150 Hz' in s.locator('.think-result').inner_text()
    assert page.locator('#tab-4 .tab-check').get_attribute('aria-label')=='Not done'
    s.get_by_label('Speaker side',exact=True).check()
    assert page.locator('#tab-4 .tab-check').get_attribute('aria-label')=='Done'
    for material in ['Concrete','Glass','Wood','Foam','Curtain']:
        s.get_by_role('group',name='Wall material',exact=True).get_by_label(material,exact=True).check()
        for val in ['min','max']:
            for name in ['Thickness','Frequency','Amplitude']:
                el=s.get_by_role('slider',name=name,exact=True)
                slider(s,name,el.get_attribute(val))
    # Thickness must refresh TL immediately, without another control change.
    slider(s,'Frequency',500)
    s.get_by_role('group',name='Wall material',exact=True).get_by_label('Concrete',exact=True).check()
    slider(s,'Thickness',10)
    assert '45.0 dB' in s.locator('.caption-bar').inner_text()
    slider(s,'Thickness',20)
    assert '51.0 dB' in s.locator('.caption-bar').inner_text()
    page.locator('#btn-reset').click()
    record(s,'It gets quieter.')
    s.get_by_role('button',name='Sound: Off',exact=True).click()
    slider(s,'Frequency',150);slider(s,'Frequency',2000)
    page.wait_for_timeout(800)
    for size in [(1366,768),(1024,600)]:
        page.set_viewport_size({'width':size[0],'height':size[1]});page.wait_for_timeout(100)
        page.screenshot(path=f'{out}/transmission-{size[0]}.png')
    page.locator('#tab-3').click();s=page.locator('#scene-3')
    assert page.evaluate('audioCalls.filter(c=>c.name==="stopAll").length')>0
    # Claps before predicting must not count toward reveal.
    s.get_by_role('button',name='Play clap',exact=True).click()
    s.get_by_role('group',name='Material',exact=True).get_by_label('Foam',exact=True).check()
    s.get_by_role('button',name='Play clap',exact=True).click()
    record(s,'Foam')
    assert not s.locator('.think-result').is_visible()
    s.get_by_role('button',name='Play clap',exact=True).click()
    s.get_by_role('group',name='Material',exact=True).get_by_label('Wood',exact=True).check()
    s.get_by_role('button',name='Play clap',exact=True).click()
    assert s.locator('.think-result').is_visible()
    claps=page.evaluate('audioCalls.filter(c=>c.name==="clap").slice(-2)')
    assert claps[1]['opts']['delay']==0.15
    assert abs(claps[1]['opts']['gain']/claps[0]['opts']['gain']-(0.85**0.5))<1e-9
    assert 'Foam: 15.0%' in s.locator('.think-result').inner_text()
    slider(s,'Thickness',10)
    assert page.locator('#tab-3 .tab-check').get_attribute('aria-label')=='Done'
    s.get_by_role('button',name='Sound: Off',exact=True).click()
    s.get_by_role('group',name='Material',exact=True).get_by_label('Foam',exact=True).check()
    slider(s,'Thickness',15)
    page.wait_for_timeout(2200)
    for size in [(1366,768),(1024,600)]:
        page.set_viewport_size({'width':size[0],'height':size[1]});page.wait_for_timeout(100)
        page.screenshot(path=f'{out}/absorption-{size[0]}.png')
    # Pause must freeze all rendered pixels. Step advances simulation only.
    page.locator('#btn-play').click();page.wait_for_timeout(100)
    canvas=s.locator('canvas').last
    before=canvas.evaluate('(c)=>c.toDataURL()');page.wait_for_timeout(200)
    assert before==canvas.evaluate('(c)=>c.toDataURL()')
    page.locator('#btn-step').click();page.wait_for_timeout(100)
    assert before!=canvas.evaluate('(c)=>c.toDataURL()')
    page.locator('#btn-reset').click()
    assert not s.locator('.think-result').is_visible()
    assert page.locator('#tab-3 .tab-check').get_attribute('aria-label')=='Done'
    assert s.get_by_role('button',name='Sound: Off',exact=True).is_visible()
    # Scene reentry is clean, and no external requests are needed.
    page.locator('#tab-4').click();page.locator('#tab-3').click()
    assert s.get_by_role('button',name='Sound: Off',exact=True).is_visible()
    # CPU-throttled scene 1 and both new scenes: collect real RAF intervals.
    client=page.context.new_cdp_session(page);client.send('Emulation.setCPUThrottlingRate',{'rate':4})
    fps={}
    for n in [1,3,4]:
        page.locator(f'#tab-{n}').click()
        page.locator(f'#scene-{n}').get_by_role('button',name='Sound: Off',exact=True).click()
        fps[n]=page.evaluate('''()=>new Promise(resolve=>{let first=0,count=0;function f(t){if(!first)first=t;count++;if(t-first>1200)resolve(Math.round(1000*(count-1)/(t-first)));else requestAnimationFrame(f);}requestAnimationFrame(f);})''')
    # Creating the first audio context while paused must stay silent.
    silent=b.new_page()
    silent.add_init_script('''window.audioContexts=[];window.AudioContext=new Proxy(window.AudioContext,{construct(Target,args){const ctx=new Target(...args);audioContexts.push(ctx);return ctx;}});''')
    silent.goto('http://127.0.0.1:3000/#4')
    silent.locator('#btn-play').click()
    silent.locator('#scene-4').get_by_role('button',name='Sound: Off',exact=True).click()
    silent.wait_for_timeout(100)
    assert silent.evaluate('audioContexts[0].state')=='suspended'
    silent.close()
    assert not errors,errors
    print(json.dumps({'errors':errors,'prediction_and_progress':'passed','pause_step_reset':'passed','4x_cpu_fps':fps,'screenshots':out}))
    b.close()
