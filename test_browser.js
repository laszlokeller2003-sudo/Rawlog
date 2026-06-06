import puppeteer from 'puppeteer'

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`)
  })

  page.on('pageerror', err => {
    console.log(`[BROWSER ERROR]: ${err.toString()}`)
  })

  try {
    console.log('Navigating to http://localhost:5173/ ...')
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 5000 })
    
    console.log('Successfully navigated.')
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Dump default onboarding view
    const initialRoot = await page.evaluate(() => document.getElementById('root')?.innerHTML)
    console.log(`ROOT HTML (DEFAULT ONBOARDING): \n${initialRoot}`)
    
    // Debug layout
    const layoutDebug = await page.evaluate(() => {
      const getStats = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return `${sel}: NOT FOUND`;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return `${sel}: size=${el.offsetWidth}x${el.offsetHeight}, client=${el.clientWidth}x${el.clientHeight}, rect=${rect.width}x${rect.height} (top=${rect.top}, left=${rect.left}), display=${style.display}, opacity=${style.opacity}, visibility=${style.visibility}`;
      };
      return [
        getStats('#root'),
        getStats('.app-container'),
        getStats('.flex-1'),
        getStats('.absolute'),
        getStats('.min-h-full'),
        getStats('.btn-primary'),
        getStats('span')
      ].join('\n');
    });
    console.log('LAYOUT DEBUG INFO:\n' + layoutDebug);

    // Save onboarding screenshot
    const artifactPath = '/Users/laszlokeller/.gemini/antigravity/brain/440f1094-a4dc-4927-bbc8-25e4cee7e076';
    await page.screenshot({ path: `${artifactPath}/onboarding_screenshot.png` })
    console.log('Saved onboarding screenshot.')

    // Now, simulate onboarded user in localStorage
    console.log('Setting localStorage to simulate onboarded user...')
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem('rawlog-profile', JSON.stringify({
        state: {
          profile: {
            name: 'John Doe',
            language: 'en',
            currency: 'EUR',
            selectedCategories: ['substances', 'intimacy', 'fitness', 'sleep', 'mood', 'nutrition', 'finance', 'social', 'work', 'health'],
            goals: [],
            reminderFrequency: 'none',
            cloudSyncEnabled: false,
            appLockEnabled: false,
            isPremium: true, // test premium dashboard content as well
            onboardingComplete: true,
            dailyReportEnabled: true,
            dailyReportTime: '21:00',
            weeklyReportEnabled: true,
            monthlyReportEnabled: true,
          }
        }
      }))
    })

    console.log('Reloading page with simulated user state...')
    await page.reload({ waitUntil: 'networkidle2' })
    await new Promise(resolve => setTimeout(resolve, 1500))

    const onboardedRoot = await page.evaluate(() => document.getElementById('root')?.innerHTML)
    console.log(`ROOT HTML (ONBOARDED DASHBOARD): \n${onboardedRoot.slice(0, 1000)}`)

    // Save dashboard screenshot
    await page.screenshot({ path: `${artifactPath}/dashboard_screenshot.png` })
    console.log('Saved dashboard screenshot.')

  } catch (err) {
    console.error(`Navigation failed: ${err.message}`)
  } finally {
    await browser.close()
  }
}

run()
