export function getSteamImage(
  appid: number | string,
  type: 'header' | 'capsule' | 'library' | 'hero' = 'header'
) {
  const base = 'https://cdn.cloudflare.steamstatic.com/steam/apps'

  switch (type) {
    case 'header':
      return `${base}/${appid}/header.jpg`
    case 'capsule':
      return `${base}/${appid}/capsule_616x353.jpg`
    case 'library':
      return `${base}/${appid}/library_600x900.jpg`
    case 'hero':
      return `${base}/${appid}/library_hero.jpg`
    default:
      return `${base}/${appid}/header.jpg`
  }
}
