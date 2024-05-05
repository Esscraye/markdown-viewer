var $ = document.querySelector.bind(document)

var state = {
  theme: args.theme,
  raw: args.raw,
  themes: args.themes,
  content: args.content,
  compiler: args.compiler,
  icon: args.icon,
  html: '',
  markdown: '',
  toc: '',
  reload: {
    interval: null,
    ms: 1000,
    md: false,
  },
  _themes: {
    // 'github': 'light',
    // 'github-dark': 'dark',
    // 'almond': 'light',
    // 'air': 'light',
    // 'awsm': 'light',
    // 'axist': 'light',
    // 'bamboo': 'auto',
    // 'bullframe': 'light',
    // 'holiday': 'auto',
    // 'kacit': 'light',
    // 'latex': 'light',
    // 'marx': 'light',
    // 'mini': 'light',
    // 'modest': 'light',
    // 'new': 'auto',
    // 'no-class': 'auto',
    // 'pico': 'auto',
    // 'retro': 'dark',
    // 'sakura': 'light',
    // 'sakura-vader': 'dark',
    // 'semantic': 'light',
    // 'simple': 'auto',
    // 'splendor': 'light',
    // 'style-sans': 'light',
    // 'style-serif': 'light',
    // 'stylize': 'light',
    // 'superstylin': 'auto',
    // 'tacit': 'light',
    // 'vanilla': 'auto',
    'water': 'light',
    'water-dark': 'dark',
    // 'writ': 'light',
  }
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.message === 'reload') {
    location.reload(true)
  }
  else if (req.message === 'theme') {
    state.theme = req.theme
    m.redraw()
  }
  else if (req.message === 'themes') {
    state.themes = req.themes
    m.redraw()
  }
  else if (req.message === 'raw') {
    state.raw = req.raw
    m.redraw()
  }
  else if (req.message === 'autoreload') {
    clearInterval(state.reload.interval)
  }
})

const oncreate = {
  markdown: () => {
    setTimeout(() => scroll(), 0)
  },
  html: () => {
    update()
  }
}

const onupdate = {
  html: () => {
    if (state.reload.md) {
      state.reload.md = false
      update(true)
    }
  },
  theme: () => {
    if (state.content.mermaid) {
      setTimeout(() => mmd.render(), 0)
    }
  }
}

const update = (update) => {
  scroll(update)

  if (state.content.syntax) {
    setTimeout(() => Prism.highlightAll(), 20)
  }

  if (state.content.mermaid) {
    setTimeout(() => mmd.render(), 40)
  }

  if (state.content.mathjax) {
    setTimeout(() => mj.render(), 60)
  }
}

const render = (md) => {
  state.markdown = frontmatter(md)
  chrome.runtime.sendMessage({
    message: 'markdown',
    compiler: state.compiler,
    markdown: state.markdown
  }, (res) => {
    state.html = res.html
    state.html = state.html.replace(
      /<img src="/gi,
      '<img loading="lazy" src="'
    )
    if (state.content.emoji) {
      state.html = emojinator(state.html)
    }
    if (state.content.mermaid) {
      state.html = state.html.replace(
        /<code class="language-(?:mermaid|mmd)">/gi,
        '<code class="mermaid">'
      )
    }
    if (state.content.toc) {
      state.toc = toc.render(state.html)
    }
    state.html = anchors(state.html)
    m.redraw()
  })
}

function mount () {
  $('pre').style.display = 'none'
  const md = $('pre').innerText
  favicon()

  m.mount($('body'), {
    oninit: () => {
      render(md)
    },
    view: () => {
      let dom = []

      const back_to_top = m('a.back-to-top', {
        href: '#',
        onclick: () => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return false // Prevent the link from navigating to a new page
        }
      }, [
        m('svg', {
          xmlns: "http://www.w3.org/2000/svg",
          class: "back-to-top-icon",
          fill: "none",
          viewBox: "0 0 24 24",
          stroke: "currentColor"
        }, [
          m('path', {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M7 11l5-5m0 0l5 5m-5-5v12"
          })
        ])
      ])
      
      dom.push(back_to_top);

      // Add an event listener to the window object that listens for the scroll event
      window.addEventListener('scroll', () => {
        const button = document.getElementsByClassName('back-to-top')[0]
        if (button) {
          if (window.scrollY > 200) {
            button.style.display = 'block' // Show the button when the user has scrolled down the page
          } else {
            button.style.display = 'none' // Hide the button when the user has scrolled back to the top of the page
          }
        }
      })

      if (state.raw) {
        dom.push(m('pre#_markdown', {oncreate: oncreate.markdown}, state.markdown))
        $('body').classList.remove('_toc-left', '_toc-right')
      }
      else if (state.html) {
        const loaded = Array.from($('body').classList).filter((name) => /^_theme/.test(name))[0]
        $('body').classList.remove(loaded)
        dom.push(m('link#_theme', {
          onupdate: onupdate.theme,
          rel: 'stylesheet', type: 'text/css',
          href: chrome.runtime.getURL(`/themes/${state.theme}.css`),
        }))
        $('body').classList.add(`_theme-${state.theme}`)

        if (state.content.syntax) {
          const prism =
            state._themes[state.theme] === 'dark' ||
            (state._themes[state.theme] === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
            ? 'prism-okaidia' : 'prism'
          dom.push(m('link#_prism', {
            rel: 'stylesheet', type: 'text/css',
            href: chrome.runtime.getURL(`/vendor/${prism}.min.css`),
          }))
        }

        dom.push(m('#_html', {oncreate: oncreate.html, onupdate: onupdate.html,
          class: (/github(-dark)?/.test(state.theme) ? 'markdown-body' : 'markdown-theme') +
          (state.themes.width !== 'auto' ? ` _width-${state.themes.width}` : '')
        },
          m.trust(state.html)
        ))

        if (state.content.toc) {
          dom.push(m('#_toc.tex2jax-ignore', m.trust(state.toc)))
          $('body').classList.add('_toc-left')
        }
      }

      return dom
    }
  })
}

const anchors = (html) =>
  html.replace(/(<h[1-6] id="(.*?)">)/g, (header, _, id) =>
    header +
    '<a class="anchor" name="' + id + '" href="#' + id + '">' +
    '<span class="octicon octicon-link"></span></a>'
  )

const toc = (() => {
  const walk = (regex, string, group, result = [], match = regex.exec(string)) =>
    match ? walk(regex, string, group, result.concat(group ? group.reduce((all, name, index) => (all[name] = match[index + 1], all), {}) : match[1])) : result
  return {
    render: (html) => {
      const headings = walk(
        /<h([1-6]) id="(.*?)">(.*?)<\/h[1-6]>/gs,
        html,
        ['level', 'id', 'title']
      )
      
      let toc = '<ul class="toc">';
      let index = 1;
      
      headings.forEach((element, item, arr) => {
        let { id, title, level } = element;
        level = parseInt(level);
          if (level === index) {
            toc +=
            '<li class="_li">' +
            (level < 6 && (arr.length - 1 != item) && (arr[item+1].level > level) ? '<button class="_btn">+</button>' : '<div class="_tocBlank"></div>') +
            '<a href="#' + id + '">' + title.replace(/<a[^>]+>/g, '').replace(/<\/a>/g, '') + '</a>' +
            (level < 6 && (arr.length - 1 != item) && (arr[item+1].level > level) ? '' : '</li>');
          } else if (level > index) {
            toc +=
            '<ul class="_ul _ul-collapsed">' +
            '<li class="_li">' +
            (level < 6 && (arr.length - 1 != item) && (arr[item+1].level > level) ? '<button class="_btn">+</button>' : '<div class="_tocBlank"></div>') +
            '<a href="#' + id + '">' + title.replace(/<a[^>]+>/g, '').replace(/<\/a>/g, '') + '</a>' +
            (level < 6 && (arr.length - 1 != item) && (arr[item+1].level > level) ? '' : '</li>');
            index = level;
          } else if (level < index) {
            toc +=
            '</ul></li>'.repeat(index - level) +
            '<li class="_li">' +
            (level < 6 && (arr.length - 1 != item) && (arr[item+1].level > level) ? '<button class="_btn">+</button>' : '<div class="_tocBlank"></div>') +
            '<a href="#' + id + '">' + title.replace(/<a[^>]+>/g, '').replace(/<\/a>/g, '') + '</a>' +
            (level < 6 && (arr.length - 1 != item) && (arr[item+1].level > level) ? '' : '</li>');
            index = level;
          }
      });

      toc += '</ul>'.repeat(index - 1);

      const tocElement = document.createElement('div')
      tocElement.innerHTML = toc;

      return tocElement.innerHTML;
    }
  }
})()

const frontmatter = (md) => {
  if (/^-{3}[\s\S]+?-{3}/.test(md)) {
    let [, yaml] = /^-{3}([\s\S]+?)-{3}/.exec(md)
    let title = /title: (?:'|")*(.*)(?:'|")*/.exec(yaml)
    title && (document.title = title[1])
  }
  else if (/^\+{3}[\s\S]+?\+{3}/.test(md)) {
    let [, toml] = /^\+{3}([\s\S]+?)\+{3}/.exec(md)
    let title = /title = (?:'|"|`)*(.*)(?:'|"|`)*/.exec(toml)
    title && (document.title = title[1])
  }
  return md.replace(/^(?:-|\+){3}[\s\S]+?(?:-|\+){3}/, '')
}

const favicon = () => {
  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = chrome.runtime.getURL(`/icons/${state.icon}/16x16.png`)
  $('head').appendChild(favicon)
}

function tocbtn() {
  const allbtn = document.querySelectorAll('._btn');
  if (allbtn.length > 0) {
    console.log('btn found')
    document.querySelectorAll('._btn').forEach(btn => {
      btn.addEventListener('click', event => {
        event.stopPropagation()
        const ul = btn.parentNode.querySelector('._ul')
        if (ul) {
          ul.classList.toggle('_ul-collapsed')
          btn.textContent = ul.classList.contains('_ul-collapsed') ? '+' : '-'
        }
      })
    })
  } else {
    console.log('no btn');
    setTimeout(() => tocbtn(), 30)
  }
}

if (document.readyState === 'complete') {
  mount()
  tocbtn()
}
else {
  const timeout = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(timeout)
      mount()
      tocbtn()
    }
  }, 0)
}
