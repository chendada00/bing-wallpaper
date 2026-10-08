export function getHighResImageUrl(item) {
  return (
    item?.sourceImage ||
    item?.image ||
    item?.preview ||
    ''
  )
}

export function getStableHighResImageUrl(item) {
  return (
    item?.image ||
    item?.sourceImage ||
    item?.preview ||
    ''
  )
}