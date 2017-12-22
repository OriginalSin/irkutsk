var map = new L.Map(document.body.getElementsByClassName('map')[0], {
	layers: [],
	attributionControl: false,
	zoomControl: true,
	//srs: 3857,
	scrollWheelZoom: true,
	center: new L.LatLng(45.47987347203981, 42.03712463378906),
	zoom: 10
});
L.gmx.loadMap('F4BEA507CF0A416081C21300AF0AD68A', {leafletMap: map});
var blm = map.gmxBaseLayersManager;
var sat1 = L.tileLayer('//maps.kosmosnimki.ru/TileService.ashx?request=getTile&map=PLDYO&LayerName=63E083C0916F4414A2F6B78242F56CA6&z={z}&x={x}&y={y}&srs=3857&apikey=AYU65737MA', {zIndex: -1000000}),
	slope = L.tileLayer.Mercator('http://{s}.tile.cart.kosmosnimki.ru/ds/{z}/{x}/{y}.png');
// blm.add('slope', {
	// layers: [slope]
// });
// blm.add('satellite', {
	// layers: [sat1]
// });
// blm.setActiveIDs(['slope', 'satellite']);
// blm.setCurrentID('satellite');
L.control.iconLayers([
	{
		title: 'Снимки',
		icon: '//maps.kosmosnimki.ru/api/img/baseLayers/basemap_satellite.png',
		layer: sat1
	},
	{
		title: 'Уклоны',
		icon: '//maps.kosmosnimki.ru/api/img/baseLayers/basemap_relief_slope.png',
		description: '<img src = "//maps.kosmosnimki.ru/api/img/baseLayers/basemap_relief_slope_legend.svg"></img>',
		layer: slope
	}
], {}).addTo(map);
