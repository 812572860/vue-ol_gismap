# vue-ol_gismap

## 安装依赖

```
yarn add vue-ol_gismap
```

### main.js 中全局引用

```js
import OlMap from 'vue-ol_gismap'
Vue.use(OlMap)
```

### vue 组件中直接使用

```
 <GisMap
      ref="gisMap"
      :initialZoom="12"
      :extent="[102, 24, 108, 32]"
      projectionCode="EPSG:4326"
      @mapReady="onMapReady"
    >
      <VectorLayer>
        <GeoMarker :position="[106, 28]" />
        <OlMarker
          :guid="iconMark.guid"
          :position="iconMark.coord"
          highlight
          :markIcon="{
            src: `./images/marker/marker.png`,
            anchor: [0.5, 1],
            scale: 0.4,
            highlightScale: 0.6,
          }"
          :properties="iconMark"
          :showLabel="iconMark.name"
          @click="(evt) => onClickFeatureMarker(iconMark, evt)"
        />
      </VectorLayer>
    </GisMap>

  <script>
  data() {
    return {
      iconMark: {
        guid: '123',
        name: '标记‘,
        coord: [105, 26]
      }
    }
  }
    methods: {
      onMapReady(map) {
        this.map = map
        // 添加谷歌影像
        this.$refs.gisMap.addTileLayer({
          url: 'http://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
          zIndex: 0,
        })
        map.on('singleclick', evt => {
          console.log('position:   ' + evt.coordinate)
        })
      },
      onClickFeatureMarker(info, evt) {
        console.log(info, evt)
      }
    }
  </script>
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
