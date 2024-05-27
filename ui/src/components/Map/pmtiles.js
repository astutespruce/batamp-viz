/**
 * Derived from: https://github.com/am2222/mapbox-pmtiles/blob/v1.0.38/src/index.ts
 * Original source code above (v1.0.38)is MIT License, Copyright 2024 Majid Hojati
 *
 * Modified here to convert from typescript to Javascript, simplify, and use
 * local version of mapbox-gl for correct handling of access token
 * (modifications see LICENSE)
 */

/* eslint-disable max-classes-per-file */

import { PMTiles, Protocol as PMTilesProtocol, TileType } from 'pmtiles'
import { mapboxgl } from './mapbox'

const VectorTileSourceImpl = mapboxgl.Style.getSourceType('vector')

export const SOURCE_TYPE = 'pmtiles'
/**
 * Extends an object with another one
 * @param dest the destination object
 * @param sources the source objects
 * @returns an object with all the keys from both dest and sources
 */
const extend = (dest, ...sources) => {
  for (const src of sources) {
    for (const k in src) {
      dest[k] = src[k]
    }
  }
  return dest
}

const mercatorXFromLng = (lng) => (180 + lng) / 360

const mercatorYFromLat = (lat) =>
  (180 -
    (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) /
  360

class TileBounds {
  bounds

  minzoom

  maxzoom

  constructor(bounds, minzoom, maxzoom) {
    this.bounds = mapboxgl.LngLatBounds.convert(this.validateBounds(bounds))
    this.minzoom = minzoom || 0
    this.maxzoom = maxzoom || 24
  }

  /* eslint-disable-next-line class-methods-use-this */
  validateBounds(bounds) {
    // make sure the bounds property contains valid longitude and latitudes
    if (!Array.isArray(bounds) || bounds.length !== 4)
      return [-180, -90, 180, 90]
    return [
      Math.max(-180, bounds[0]),
      Math.max(-90, bounds[1]),
      Math.min(180, bounds[2]),
      Math.min(90, bounds[3]),
    ]
  }

  contains(tileID) {
    const worldSize = 2 ** tileID.z
    const level = {
      minX: Math.floor(mercatorXFromLng(this.bounds.getWest()) * worldSize),
      minY: Math.floor(mercatorYFromLat(this.bounds.getNorth()) * worldSize),
      maxX: Math.ceil(mercatorXFromLng(this.bounds.getEast()) * worldSize),
      maxY: Math.ceil(mercatorYFromLat(this.bounds.getSouth()) * worldSize),
    }
    const hit =
      tileID.x >= level.minX &&
      tileID.x < level.maxX &&
      tileID.y >= level.minY &&
      tileID.y < level.maxY
    return hit
  }
}

class Event {
  type

  constructor(type, data = {}) {
    extend(this, data)
    this.type = type
  }
}

class ErrorEvent extends Event {
  error

  constructor(error, data = {}) {
    super('error', extend({ error }, data))
  }
}

export class PMTilesSource extends VectorTileSourceImpl {
  static SOURCE_TYPE = SOURCE_TYPE

  tiles

  tileBounds

  minTileCacheSize

  maxTileCacheSize

  scope

  _implementation

  _protocol

  _instance // PMTiles isntance

  _tileJSONRequest

  loadTile

  tileType

  header

  /**
   * An static function to get the metadata of a pmtiles
   * @public
   * @param url The pmTiles URL
   * @returns A Json object of the PmTile's metadata
   */
  static async getMetadata(url) {
    const instance = new PMTiles(url)
    return instance.getMetadata()
  }

  /**
   * An static function to get the header of an pmtiles
   * @public
   * @param url The pmTiles URL
   * @returns A Json object of the PmTile's header
   */
  static async getHeader(url) {
    const instance = new PMTiles(url)
    return instance.getHeader()
  }

  /**
   * The PmTiles source. It mainly should work as a regular source as other mapbox sources.
   * @public
   *
   * @param id  The unique id of the source
   * @param options The  main pmtiles options
   * @param _dispatcher
   * @param _eventedParent
   */
  constructor(id, options, _dispatcher, _eventedParent) {
    super(...[id, options, _dispatcher, _eventedParent])

    this._implementation = options
    if (!this._implementation) {
      this.fire(
        new ErrorEvent(
          new Error(`Missing options for ${this.id} custom source`)
        )
      )
    }

    this.scheme = 'zxy'

    const { url } = options

    this._protocol = new PMTilesProtocol()
    this.tiles = [`pmtiles://${url}/{z}/{x}/{y}`]
    const p = new PMTiles(url)

    // this is so we share one instance across the JS code and the map renderer
    this._protocol.add(p)
    this._instance = p
  }

  /**
   * the extent of the entire source extracted from pmtiles header
   * @returns {mapboxgl.LngLatBoundsLike}
   */
  getExtent() {
    const { minLon, minLat, maxLon, maxLat } = this.header

    return [minLon, minLat, maxLon, maxLat]
  }

  hasTile(tileID) {
    return !this.tileBounds || this.tileBounds.contains(tileID.canonical)
  }

  load(callback) {
    this._loaded = false
    this.fire(new Event('dataloading', { dataType: 'source' }))

    // We need to get both header and metadata
    this._tileJSONRequest = Promise.all([
      this._instance.getHeader(),
      this._instance.getMetadata(),
    ])
      .then(([header, tileJSON]) => {
        this.header = header
        const { tileType, minZoom, maxZoom, minLon, minLat, maxLon, maxLat } =
          header

        const requiredVariables = [
          minZoom,
          maxZoom,
          minLon,
          minLat,
          maxLon,
          maxLat,
        ]

        if (
          !requiredVariables.includes(undefined) &&
          !requiredVariables.includes(null)
        ) {
          this.tileBounds = new TileBounds(
            [minLon, minLat, maxLon, maxLat],
            minZoom,
            maxZoom
          )
          this.minzoom = minZoom
          this.maxzoom = maxZoom
        }

        if (this.maxzoom === undefined) {
          console.warn(
            'The maxzoom parameter is not defined in the source json. This can cause memory leak. So make sure to define maxzoom in the layer'
          )
        }

        this._tileJSONRequest = undefined
        this._loaded = true

        extend(this, tileJSON)
        // we set this.type after extend to avoid overwriting
        this.tileType = tileType

        if (this.tileType === TileType.Mvt) {
          this.loadTile = this.loadVectorTile
          this.type = 'vector'
        } else {
          this.fire(new ErrorEvent(new Error('Unsupported Tile Type')))
        }

        // `content` is included here to prevent a race condition where `Style#updateSources` is called
        // before the TileJSON arrives. this makes sure the tiles needed are loaded once TileJSON arrives
        // ref: https://github.com/mapbox/mapbox-gl-js/pull/4347#discussion_r104418088
        this.fire(
          new Event('data', { dataType: 'source', sourceDataType: 'metadata' })
        )
        this.fire(
          new Event('data', { dataType: 'source', sourceDataType: 'content' })
        )
      })
      .catch((err) => {
        this.fire(new ErrorEvent(err))
        if (callback) callback(err)
      })
  }

  loaded() {
    return this._loaded
  }

  loadVectorTile(tile, callback) {
    const done = (err, data) => {
      delete tile.request

      if (tile.aborted) return callback(null)

      if (err && err.status !== 404) {
        return callback(err)
      }

      if (data && data.resourceTiming) tile.resourceTiming = data.resourceTiming

      if (this.map?._refreshExpiredTiles && data) tile.setExpiryData(data)
      tile.loadVectorData(data, this.map?.painter)

      callback(null)

      if (tile.reloadCallback) {
        this.loadVectorTile(tile, tile.reloadCallback)
        tile.reloadCallback = null
      }
    }

    const url = this.map?._requestManager.normalizeTileURL(
      tile.tileID.canonical.url(this.tiles, this.scheme)
    )
    const request = this.map?._requestManager.transformRequest(url, 'Tile')

    const params = {
      request,
      data: {},
      uid: tile.uid,
      tileID: tile.tileID,
      tileZoom: tile.tileZoom,
      zoom: tile.tileID.overscaledZ,
      tileSize: this.tileSize * tile.tileID.overscaleFactor(),
      type: 'vector',
      source: this.id,
      scope: this.scope,
      showCollisionBoxes: this.map?.showCollisionBoxes,
      promoteId: this.promoteId,
      isSymbolTile: tile.isSymbolTile,
      extraShadowCaster: tile.isExtraShadowCaster,
    }

    const afterLoad = (error, data, cacheControl, expires) => {
      if (error || !data) {
        done.call(this, error)
        return
      }

      params.data = {
        cacheControl,
        expires,
        rawData: data,
      }
      // // the worker will skip the network request if the data is already there
      if (this.map._refreshExpiredTiles)
        tile.setExpiryData({ cacheControl, expires })
      if (tile.actor)
        tile.actor.send('loadTile', params, done.bind(this), undefined, true)
    }

    if (!tile.actor || tile.state === 'expired') {
      tile.actor = this._tileWorkers[url] =
        this._tileWorkers[url] || this.dispatcher.getActor()

      tile.request = this._protocol.tile({ ...request }, afterLoad)
      // always load tiles on the main thread and pass the result instead of requesting a worker to do so
    } else if (tile.state === 'loading') {
      // schedule tile reloading after it has been loaded
      tile.reloadCallback = callback
    } else {
      tile.request = this._protocol.tile({ ...tile, url }, afterLoad)
    }
  }
}

export default PMTilesSource
