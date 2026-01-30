<script setup>
import "leaflet/dist/leaflet.css";
import "leaflet/dist/images/marker-shadow.png";
import L, { tileLayer, map, marker, popup } from "leaflet";
import moment from "moment/min/moment-with-locales";
import axios from "axios";

const $emits = defineEmits(["clicked", "rightClicked", "markerClicked"]);
const { $createError } = useError();

const $props = defineProps({
  popup: {
    type: Boolean,
    default: false,
  },
  radius: {
    type: Boolean,
    default: false,
  },
  clean: {
    type: Boolean,
    default: false,
  },
  locations: {
    type: Array,
    default: null,
  },
  flyTo: {
    type: Object,
    default: null,
  },
  zoom: {
    type: Number,
    default: 18,
  },
});

const $icon = L.icon({
  iconUrl: "https://www.google.com/mapfiles/marker.png",
  shadowUrl: "http://www.google.com/mapfiles/shadow50.png",
  iconSize: [25, 45], // size of the icon
  shadowSize: [50, 64], // size of the shadow
  iconAnchor: [10, 40], // point of the icon which will correspond to marker's location
  shadowAnchor: [10, 60], // the same for the shadow
  popupAnchor: [3, -20], // point from which the popup should open relative to the iconAnchor
});

const $modeLayerOrder = ref(1);
const $zoom = 18;
const $attribution =
  '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a> <span>(200m)</span>';
const $baseLayers = {
  default: tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: $attribution,
  }),
  // googleStreets: tileLayer("http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
  //   maxZoom: $props.zoom,
  //   subdomains: ["mt0", "mt1", "mt2", "mt3"],
  //   attribution: $attribution,
  // }),
  // googleHybrid: tileLayer("http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}", {
  //   maxZoom: $props.zoom,
  //   subdomains: ["mt0", "mt1", "mt2", "mt3"],
  //   attribution: $attribution,
  // }),
  // googleSat: tileLayer("http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
  //   maxZoom: $props.zoom,
  //   subdomains: ["mt0", "mt1", "mt2", "mt3"],
  //   attribution: $attribution,
  // }),
  // googleTerrain: tileLayer("http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}", {
  //   maxZoom: $props.zoom,
  //   subdomains: ["mt0", "mt1", "mt2", "mt3"],
  //   attribution: $attribution,
  // }),
};

const $map = ref(null);
const $target = ref(null);
const $markerGroup = ref(null);
const $radiusGroup = ref(null);
const $mapContent = ref(null);
const { $getGeolocation } = useNuxtApp();

const $getMetaData = async (_payload) => {
  const _geoloc = await $getGeolocation(_payload?.latlng?.lat, _payload?.latlng?.lng);
  return {
    ...(_geoloc || {}),
    latitude: _payload.latlng.lat,
    longitude: _payload.latlng.lng,
    display_name: _geoloc.display_name,
  };
};

const $flyingTo = (_coordinate) => {
  $map.value?.setZoom($props.zoom);
  $map.value?.flyTo(
    new L.LatLng(parseFloat(_coordinate.latitude), parseFloat(_coordinate.longitude)),
    $map.value.getZoom(),
    { animate: true, duration: 0.1 }
  );
};

const $setRadius = (_coordinate) =>
  $props.radius &&
  L.circle([_coordinate.latitude, _coordinate.longitude], 200).addTo($radiusGroup.value);

const $updateMapAndTarget = async (_payload) => {
  if (_payload && _payload?.latitude && _payload?.longitude) {
    const _result = await $getGeolocation(_payload?.latitude, _payload?.longitude);

    if (_result?.address) _payload.address = _result.address;
    if (_result?.display_name) _payload.display_name = _result.display_name;

    const _newMarker = new marker([_payload.latitude, _payload.longitude], { icon: $icon });

    if ($props.popup && _payload?.popup) {
      if (typeof _payload?.popup == "function") {
        _payload.popup = await _payload?.popup(_payload);
        _newMarker
          .bindPopup(
            popup({
              closeOnClick: false,
              autoClose: false,
            }).setContent(_payload.popup)
          )
          .on("add", function () {
            _newMarker.openPopup();
          });
      }
    }
    _newMarker.addTo($markerGroup.value);
    _newMarker.on("click", async (_val) => {
      const _resp = await $getMetaData(_val);
      $flyingTo(_resp);
      $emits("markerClicked", _resp);
    });

    $flyingTo(_payload);
    $setRadius(_payload);
  }
};

watch(
  () => $props.flyTo,
  () => {
    if ($props.flyTo) {
      $flyingTo($props.flyTo);
    }
  }
);

watch([() => $mapContent.value, () => $props.locations], async () => {
  if (!$props.clean && $mapContent.value?.childNodes?.length > 0) {
    return;
  }

  try {
    const _coordinates = $props.locations?.map((_item) => {
      return {
        ..._item,
        latitude:
          (_item?.latitude && Number(_item?.latitude)) ||
          (_item?.lat && Number(_item?.lat)) ||
          null,
        longitude:
          (_item?.longitude && Number(_item?.longitude)) ||
          (_item?.lon && Number(_item?.lon)) ||
          null,
      };
    }); //|| [{ latitude: "-8.5869286", longitude: "116.0910654" }];
    const xBase = _coordinates?.[0]?.latitude;
    const yBase = _coordinates?.[0]?.longitude;

    if (_coordinates?.length <= 0 || !xBase || !yBase) {
      throw new Error("Failed to load locations");
    }

    if ($mapContent.value?.childNodes?.length <= 0) {
      $map.value = map("map-content", {
        center: [xBase, yBase],
        zoom: 17,
        fadeAnimation: true,
        zoomAnimation: false,
        markerZoomAnimation: false,
      });

      $baseLayers.default.addTo($map.value);

      $map.value.on("click", async (_val) => {
        $emits("clicked", await $getMetaData(_val));
      });
      $map.value.on("contextmenu", async (_val) => {
        $emits("rightClicked", await $getMetaData(_val));
      });
    } else {
      $markerGroup.value?.clearLayers();
      $radiusGroup.value?.clearLayers();
    }

    $markerGroup.value = L.layerGroup().addTo($map.value);
    $radiusGroup.value = L.layerGroup().addTo($map.value);

    // const _btnGantiMode = L.Control.extend({
    //   options: {
    //     position: "topleft",
    //   },

    //   onAdd: function () {
    //     const _bControl = L.DomUtil.create("input");
    //     _bControl.type = "button";
    //     _bControl.title = "Ganti Mode";
    //     _bControl.value = "Ganti Mode";
    //     _bControl.style.padding = "5px";
    //     _bControl.onclick = (e) => {
    //       e.stopPropagation();

    //       const _layers = Object.values($baseLayers);
    //       $map.value.removeLayer(_layers[$modeLayerOrder.value]);
    //       _layers[$modeLayerOrder.value].addTo($map.value);

    //       if ($modeLayerOrder.value >= _layers?.length - 1) {
    //         $modeLayerOrder.value = 0;
    //       } else {
    //         $modeLayerOrder.value += 1;
    //       }
    //     };
    //     return _bControl;
    //   },
    // });

    const _btnFokus = L.Control.extend({
      options: {
        position: "topleft",
      },

      onAdd: function () {
        const _bControl = L.DomUtil.create("input");
        _bControl.type = "button";
        _bControl.title = "Focus Location";
        _bControl.value = "Focus Location";
        _bControl.style.padding = "5px";
        _bControl.onclick = (e) => {
          e.stopPropagation();
          if ($props.locations?.[0]) $flyingTo($props.locations?.[0]);
        };
        return _bControl;
      },
    });
    // $map.value.addControl(_btnFokus);
    _coordinates?.forEach((_coordinate) => $updateMapAndTarget(_coordinate));
  } catch (error) {
    $createError(error);
  }
});
</script>
<template>
  <div v-bind="$attrs" ref="$mapContent" id="map-content" style="cursor: pointer !important"></div>
</template>
