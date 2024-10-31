import { fromArrow } from 'arquero'

export const fetchFeather = async (url) => {
  const response = await fetch(url)
  if (response.status !== 200) {
    throw new Error(`Failed request to ${url}: ${response.statusText}`)
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  return fromArrow(bytes)
}
