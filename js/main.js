var map = new L.Map(document.body.getElementsByClassName('map')[0], {
	layers: [],
	//crs: L.CRS.EPSG3395,
	center: new L.LatLng(53.08, 106.12),
	attributionControl: true,
	zoomControl: true,
	scrollWheelZoom: true,
	zoom: 4
});
var protocol = location.protocol === 'file:' ? 'http:' : location.protocol,
	baseLayers = {
		'Карта': L.tileLayer(protocol + '//tilessputnik.ru/{z}/{x}/{y}.png'),
		'Спутник': L.tileLayer(protocol + '//maps.kosmosnimki.ru/TileService.ashx?LayerName=C598DBF5726945AFBEC937E086447DBF&map=5AE44B9616754357B39802C0620B2713&crs=epsg:3857&request=getTile&apiKey=6Q81IXBUQ7&z={z}&x={x}&y={y}')
	},
	overlayes = {
	};

baseLayers['Карта'].addTo(map);
L.control.layers(baseLayers, overlayes).addTo(map);
