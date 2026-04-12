import c from "ansi-colors"
import { useLocation } from "react-router"
import React from "react"
c.enabled = true
export const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}

export const delayOnce = (fn: Function, ms = 300) => {
  return new Promise<void>(res => {
    fn()
    setTimeout(() => res(), ms)
  })
}

export const getMimeTypeFromExtension = (extension = "txt") => {
  if (extension[0] === ".") {
    extension = extension.substr(1)
  }
  return (
    {
      aac: "audio/aac",
      abw: "application/x-abiword",
      arc: "application/x-freearc",
      avi: "video/x-msvideo",
      azw: "application/vnd.amazon.ebook",
      bin: "application/octet-stream",
      bmp: "image/bmp",
      bz: "application/x-bzip",
      bz2: "application/x-bzip2",
      cda: "application/x-cdf",
      csh: "application/x-csh",
      css: "text/css",
      csv: "text/csv",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      eot: "application/vnd.ms-fontobject",
      epub: "application/epub+zip",
      gz: "application/gzip",
      gif: "image/gif",
      htm: "text/html",
      html: "text/html",
      ico: "image/vnd.microsoft.icon",
      ics: "text/calendar",
      jar: "application/java-archive",
      jpeg: "image/jpeg",
      jpg: "image/jpeg",
      js: "text/javascript",
      json: "application/json",
      jsonld: "application/ld+json",
      mid: "audio/midi audio/x-midi",
      midi: "audio/midi audio/x-midi",
      mjs: "text/javascript",
      mp3: "audio/mpeg",
      mp4: "video/mp4",
      mpeg: "video/mpeg",
      mpkg: "application/vnd.apple.installer+xml",
      odp: "application/vnd.oasis.opendocument.presentation",
      ods: "application/vnd.oasis.opendocument.spreadsheet",
      odt: "application/vnd.oasis.opendocument.text",
      oga: "audio/ogg",
      ogv: "video/ogg",
      ogx: "application/ogg",
      opus: "audio/opus",
      otf: "font/otf",
      png: "image/png",
      pdf: "application/pdf",
      php: "application/x-httpd-php",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      rar: "application/vnd.rar",
      rtf: "application/rtf",
      sh: "application/x-sh",
      svg: "image/svg+xml",
      swf: "application/x-shockwave-flash",
      tar: "application/x-tar",
      tif: "image/tiff",
      tiff: "image/tiff",
      ts: "video/mp2t",
      tsc: "text/typescript",
      ttf: "font/ttf",
      txt: "text/plain",
      vsd: "application/vnd.visio",
      wav: "audio/wav",
      weba: "audio/webm",
      webm: "video/webm",
      webp: "image/webp",
      woff: "font/woff",
      woff2: "font/woff2",
      xhtml: "application/xhtml+xml",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xml: "application/xml",
      xul: "application/vnd.mozilla.xul+xml",
      zip: "application/zip",
      "3gp": "video/3gpp",
      "3g2": "video/3gpp2",
      "7z": "application/x-7z-compressed",
    }[extension] || "application/octet-stream"
  )
}

// will compare two objects recursively to determine if they are equal or not
// from : https://stackoverflow.com/a/52645018/6641693
export const isEqual = (a: any, b: any): Boolean => {
  if (a === b) return true
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (!a || !b || (typeof a !== "object" && typeof b !== "object"))
    return a === b
  if (a === null || a === undefined || b === null || b === undefined)
    return false
  if (a.prototype !== b.prototype) return false
  let keys = Object.keys(a)

  if (keys.length !== Object.keys(b).length) return false
  if (
    typeof a === "object" &&
    typeof b === "object" &&
    JSON.stringify(a) === JSON.stringify(b)
  )
    return true
  return keys.every(k => isEqual(a[k], b[k]))
}

export const genUID = () => {
  return (
    Math.random().toString(24).substring(2, 10) +
    Math.random().toString(24).substring(2, 10)
  )
}

export const safeStringCast = (value: any) => {
  return value?.toString() || "undefined"
}

export const colorLog = (log: string[]) => {
  return log.map(lge => {
    switch (true) {
      case lge.toLowerCase().includes("error"):
        return c.red(lge)
      case lge.toLowerCase().includes("warn"):
        return c.yellow(lge)
      default:
        return lge
        break
    }
  })
}

// a custom hook to parse query params from url
export function useQuery() {
  const { search } = useLocation()

  return React.useMemo(() => new URLSearchParams(search), [search])
}

export function isReactFragment(variableToInspect) {
  if (variableToInspect.type) {
    return variableToInspect.type === React.Fragment
  }
  return variableToInspect === React.Fragment
}
