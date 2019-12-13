/* eslint-disable max-len */
const mkConnectServices = ["Twitter", "GitHub", "Discord"]

const { promisify } = require("util")
const sass = require("sass")
const CleanCss = require("clean-css")
const htmlToText = require("html-to-text")
const request = require("request")
const mkdirp = require("mkdirp")
const extend = require("extend")
const semver = require("semver")
const glog = require("fancy-log")
const colors = require("colors")
const glob = require("glob")
const path = require("path")

const fontawesome = require("@fortawesome/fontawesome-svg-core")
const downloadTemp = require("../../downloadTemp")
fontawesome.library.add(require("@fortawesome/free-solid-svg-icons").fas, require("@fortawesome/free-regular-svg-icons").far, require("@fortawesome/free-brands-svg-icons").fab)

const get = promisify(request.get)
const post = promisify(request.post)

async function getContributors() {
  try {
    const res = await get(
      "https://api.github.com/repos/syuilo/misskey/contributors",
      {
        headers: {
          "User-Agent": "LuckyBeast"
        },
        json: true
      }
    )
    return res.body
  } catch (e) {
    glog("Cannot get GitHub contributors")
    glog(e)
    return null
  }
}

async function getPatrons(patreonUrl, keys) {
  try {
    const res = await get(patreonUrl, { headers: { Authorization: `Bearer ${keys.patreon.bearer}` } })
    const parsed = JSON.parse(res.body)
    return parsed
  } catch (e) {
    glog("Cannot get Patreon patrons")
    glog(e)
    return null
  }
}

async function getAmpCss() {
  let ampcss = ""
  try {
    ampcss += "/*Based on Bootstrap v4.1.3 (https://getbootstrap.com)|Copyright 2011-2018 The Bootstrap Authors|Copyright 2011-2018 Twitter, Inc.|Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)*/\n"
    ampcss += (await promisify(sass.render)({ file: "theme/styl/amp/amp_main.sass" })).css.toString()
    ampcss += "\n"
    ampcss += fontawesome.dom.css()
    ampcss += "\n"
    ampcss = new CleanCss().minify(ampcss).styles.replace(/!important/g, "").replace(/@charset "UTF-8";/g, "").replace(/@-ms-viewport{width:device-width}/g, "")

    glog(`making amp css: ${Buffer.byteLength(ampcss)}Byte`)
  } catch (e) {
    glog(colors.red("making amp css failed"))
    glog(colors.red(e))
    ampcss = "/* oops */"
  }
  return ampcss
}

function safePost(url, options) {
  return post(url, options).then(
    res => {
      if (res && res.statusCode === 200) return res
      return false
    }
  ).catch(() => false)
}

async function getInstancesInfos(instances) {
  const metasPromises = []
  const statsPromises = []
  const usersChartsPromises = []
  const notesChartsPromises = []
  const instancesInfos = []
  // eslint-disable-next-line no-restricted-syntax
  for (let t = 0; t < instances.length; t += 1) {
    const instance = instances[t]
    metasPromises.push(safePost(`https://${instance.url}/api/meta`, { json: true }))
    statsPromises.push(safePost(`https://${instance.url}/api/stats`, { json: true }))
    usersChartsPromises.push(safePost(`https://${instance.url}/api/charts/users`, { json: { span: "day" } }))
    notesChartsPromises.push(safePost(`https://${instance.url}/api/charts/notes`, { json: { span: "day" } }))
  }
  const [
    metas,
    stats,
    usersCharts,
    notesCharts
  ] = await Promise.all([
    Promise.all(metasPromises),
    Promise.all(statsPromises),
    Promise.all(usersChartsPromises),
    Promise.all(notesChartsPromises)
  ])

  for (let i = 0; i < instances.length; i += 1) {
    const instance = instances[i]
    const meta = metas[i] ? metas[i].body : false
    const stat = stats[i] ? stats[i].body : false
    const usersChart = usersCharts[i] ? usersCharts[i].body : false
    const notesChart = notesCharts[i] ? notesCharts[i].body : false
    if (metas[i] && stats[i]) {
      /*   インスタンスバリューの算出   */
      let value = 0
      // 1. セマンティックバージョニングをもとに並び替え (独自拡張の枝番は除去)
      const v = semver.valid(semver.coerce(meta.version))
      const varr = v ? v.split(".") : [0, 0, 0]
      value += (Number(varr[0]) * 16 * 150 + Number(varr[1]) * 16 + Number(varr[0])) * 750
      if (meta.version && meta.version.split("-").length > 1) value += 5
      // (セマンティックバージョニングに影響があるかないか程度に色々な値を考慮する)
      if (usersChart) {
        // 2.
        const arr = usersChart.local.total.filter(e => e !== 0)
        value += ((arr[0] - arr[arr.length - 1]) / arr.length) * 15
      }
      if (notesChart) {
        // 3.
        const arr = notesChart.local.total.filter(e => e !== 0)
        value += ((arr[0] - arr[arr.length - 1]) / arr.length) * 0.6
      }

      // 4.
      value += stat.originalNotesCount > 0 ? Math.log10(stat.originalNotesCount) * 7 : 0
      // 5.
      value += stat.originalUsersCount > 0 ? Math.log2(stat.originalUsersCount) * 1 : 0
      // 6.
      value += meta.driveCapacityPerLocalUserMb > 0 ? Math.log10(meta.driveCapacityPerLocalUserMb) * 10 : 0

      // 7.
      if (meta.features) {
        if (meta.features.elasticsearch) value += 128
        if (meta.features.recaptcha) value += 64
        let v2 = 0
        // eslint-disable-next-line no-restricted-syntax
        for (let t = 0; t < mkConnectServices.length; t += 1) {
          const service = mkConnectServices[t]
          if (meta.features[service.toLowerCase()]) { v2 += 16 }
        }
        if (v2 > 0) value += v2 + 16
        if (meta.features.serviceWorker) value += 16
      }

      instancesInfos.push(extend(true, instance, {
        value,
        meta,
        stats: stat,
        description: metas[i].body.description ? htmlToText.fromString(metas[i].body.description).replace(/\n/g, "<br>") : (instance.description || false),
        isAlive: true
      }))
    } else {
      instancesInfos.push(extend(true, { isAlive: false, value: 0 }, instance))
    }
  }
  return instancesInfos.sort((a, b) => {
    if (!a.isAlive && b.isAlive) return 1
    if (a.isAlive && !b.isAlive) return -1
    if (a.isAlive && b.isAlive) return (b.value || 0) - (a.value || 0)
    return (b.url > a.url ? -1 : 1)
  })
}

module.exports = async (site, keys, tempDir, instances) => {
  const creditIconsPromises = []

  await promisify(mkdirp)(`${tempDir}github/`)

  /* get contrbutors from GitHub API */
  const contributors = await getContributors()

  // eslint-disable-next-line no-restricted-syntax
  for (let t = 0; t < contributors.length; t += 1) {
    const contributor = contributors[t]
    creditIconsPromises.push(downloadTemp(`github/${contributor.id}`, contributor.avatar_url, tempDir))
  }
  glog("Got contributors from GitHub")

  /* get patrons from Patreon API */

  await promisify(mkdirp)(`${tempDir}patreon/`)

  let patrons = null
  if (keys != null && keys.patreon) {
    patrons = []
    patrons.push(
      {
        title: "the Others",
        titles: site.i18n.the_other_backers,
        amountCents: 0,
        members: []
      }
    )

    let patreonUrl = `https://www.patreon.com/api/oauth2/v2/campaigns/${keys.patreon.campaign}/members?include=currently_entitled_tiers,user&fields%5Bmember%5D=currently_entitled_amount_cents&fields%5Btier%5D=amount_cents,title&fields%5Buser%5D=full_name,thumb_url,url,hide_pledges`
    while (patreonUrl) {
      // eslint-disable-next-line no-await-in-loop
      const n = await getPatrons(patreonUrl, keys)

      if (n) {
        for (let t = 0; t < n.data.length; t += 1) {
          const e = n.data[t]
          // eslint-disable-next-line no-continue
          if (e.attributes.currently_entitled_amount_cents === 0) continue

          const cet = e.relationships.currently_entitled_tiers

          const member = n.included.find(g => g.id === e.relationships.user.data.id && g.type === "user")
          member.currently_entitled_amount_cents = e.attributes.currently_entitled_amount_cents

          if (cet.data.length > 0) {
            // eslint-disable-next-line no-underscore-dangle
            const _tier = n.included.find(g => g.id === cet.data[0].id && g.type === "tier")

            const tier = patrons.find(e => e.id === _tier.id)
            if (!tier) {
              patrons.push({
                title: _tier.attributes.title,
                id: _tier.id,
                amountCents: _tier.attributes.amount_cents,
                members: [member]
              })
            } else {
              tier.members.push(member)
            }
          } else {
            patrons[0].members.push(member)
          }

        }
        if (n.links) patreonUrl = n.links.next; else patreonUrl = null
      } else {
        patreonUrl = null
      }
    }

    patrons.sort((a, b) => b.amountCents - a.amountCents)

    glog("Got patrons from Patreon")
    for (let m = 0; m < patrons.length; m += 1) {
      const tier = patrons[m]
      for (let n = 0; n < tier.members.length; n += 1) {
        const member = tier.members[n]
        // console.log(member)
        creditIconsPromises.push(downloadTemp(`patreon/${member.id}`, member.attributes.thumb_url, tempDir))
      }
      tier.members.sort((a, b) => b.lifetime_support_cents - a.lifetime_support_cents)
    }
  }

  await promisify(mkdirp)(`${tempDir}instance-banners/`)
  const instancesInfos = await getInstancesInfos(instances)

  const instancesBannersPromises = instancesInfos
    .filter(instance => instance.isAlive && instance.meta.bannerUrl)
    .map(instance => downloadTemp(`${instance.url}`, instance.meta.bannerUrl, `${tempDir}instance-banners/`, true))

  const [creditIcons, instancesBanners, ampcss] = await Promise.all([
    Promise.all(creditIconsPromises),
    Promise.all(instancesBannersPromises),
    getAmpCss()
  ])

  return {
    instancesInfos,
    patrons,
    contributors,
    ampcss,
    creditIcons,
    mkConnectServices,
    instancesBanners,
    baseStyles: (await promisify(glob)("theme/styl/*.s[ac]ss")).map(p => path.parse(p).name),
    lazyStyles: (await promisify(glob)("theme/styl/lazy/*.s[ac]ss")).map(p => path.parse(p).name)
  }
}
