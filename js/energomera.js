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
L.control.iconLayers([
	{
		title: 'Снимки',
		icon: '//maps.kosmosnimki.ru/api/img/baseLayers/basemap_satellite.png',
		layer: L.tileLayer('//maps.kosmosnimki.ru/TileService.ashx?request=getTile&map=PLDYO&LayerName=63E083C0916F4414A2F6B78242F56CA6&z={z}&x={x}&y={y}&srs=3857&apikey=AYU65737MA', {zIndex: -1000000})
	},
	{
		title: 'Уклоны',
		icon: '//maps.kosmosnimki.ru/api/img/baseLayers/basemap_relief_slope.png',
		description: '<img src = "//maps.kosmosnimki.ru/api/img/baseLayers/basemap_relief_slope_legend.svg"></img>',
		layer: L.tileLayer.Mercator('http://{s}.tile.cart.kosmosnimki.ru/ds/{z}/{x}/{y}.png', {zIndex: -1000000})
	}
], {}).addTo(map);
