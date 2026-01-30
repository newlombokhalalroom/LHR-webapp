export default async function () {
  const { $getGeolocation, $getGeolocationByTerm } = useNuxtApp();
  const _isGrantedGeolocation = async () => {
    if ((await navigator?.permissions?.query({ name: "geolocation" }))?.state == "denied") {
      return false;
    }
    return true;
  };
  const _getGeoPosition = async () => {
    if (navigator.geolocation) {
      return await new Promise((_res, _rej) => {
        navigator.geolocation.getCurrentPosition(async (_position) => {
          const _result = await $getGeolocation(
            _position?.coords?.latitude,
            _position?.coords?.longitude
          );
          if (_result) {
            return _res({
              ..._result,
              latitude: _position?.coords?.latitude,
              longitude: _position?.coords?.longitude,
              display_name: _result.display_name,
            });
          } else {
            return _rej(`Pastikan perangkat/browser Anda mendukung`);
          }
        });
      });
    } else {
      throw new Error(`Pastikan fitur lokasi web mendukung perangkat/browser Anda`);
    }
  };

  if (await _isGrantedGeolocation()) {
    return await _getGeoPosition();
  }

  throw new Error(`Pastikan Anda telah mengizinkan website untuk mengakses lokasi Anda`);
}
