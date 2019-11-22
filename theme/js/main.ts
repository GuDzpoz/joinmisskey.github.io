import { fainit } from "./lib/fainit"
import { gad } from "./lib/gad"
import { gainit } from "./lib/gainit"
import { gototop } from "./lib/gototop"
import { importCss } from "./lib/import-css"
import { localeMove } from "./lib/locale-move"
import { detectOldBrowser } from "./lib/old-browsers"
import onLoad from "./lib/onLoad"
import onReady from "./lib/onReady"
import { removeMoved } from "./lib/remove-moved"
import { scrolltoshow } from "./lib/scrolltoshow"
import { twemojiinit } from "./lib/twemojiinit"

import { Loading } from "./lib/loading"
import { LoadToShow } from "./lib/loadtoshow"
import { searchinit } from "./lib/searchinit"

detectOldBrowser()
localeMove()
removeMoved()
gainit()
importCss()
twemojiinit()
fainit()

onReady(() => {
  new Loading()
  scrolltoshow()
  searchinit()
  gototop()
  new LoadToShow()
})

onLoad(() => {
  gad()
})
