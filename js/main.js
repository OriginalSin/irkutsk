var curDate = new Date(Date.now());

var dateBegin = new Date(Date.UTC(curDate.getFullYear(), curDate.getMonth(), curDate.getDate())),
	dateEnd = new Date(dateBegin.getTime() + 1000*60*60*24),
	bboxFlag = location.search.indexOf('bbox=1') !== -1;

var myIcon = L.icon({
    iconUrl: 'css/fire.png',
    popupAnchor: [6, 0]
});

if (location.search.indexOf('sw=1') !== -1) {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('./gmx-sw1.js')
		  .then(function(registration) {
			console.log('ServiceWorker registration successful with scope: ', registration.scope);
		  })
		  .catch(function(err) {
			console.log('ServiceWorker registration failed: ', err);
		  });
	} else {
		console.error('Your browser does not support Service Workers.');
	}
}

var map = new L.Map(document.body.getElementsByClassName('map')[0], {
	layers: [],
	attributionControl: true,
	zoomControl: true,
	scrollWheelZoom: true,
	center: new L.LatLng(56.304348, 105.84228),
	zoom: 6
});
map.zoomControl.setPosition('bottomleft');

var firesOverlay = L.markerClusterGroup();

var currentBbox = null;
var getItems = function() {
	//console.log(beg, end, currentBbox);
	var url = '//sender.kosmosnimki.ru/irk-fires/hotspots';
	url += '/' + parseInt(dateBegin.getTime() / 1000);
	url += '/' + parseInt(dateEnd.getTime() / 1000);
	if (bboxFlag) {
		url += '?bbox=' + JSON.stringify(currentBbox);
	}
	map.spin(true);

	fetch(encodeURI(url), {
		mode: 'cors',
		credentials: 'include'
	})
		.then(function(response) { return response.json(); })
		.then(function(json) {
			// console.log('json', json);
			var geo = L.geoJSON(json);
			geo.eachLayer(function (marker) {
				marker
					.bindPopup()
					.on('popupopen ', function(ev) {
						// console.log('Clicked on a member of the group!', ev);
						var target = ev.target,
							_latlng = target._latlng,
							props = target.feature.properties,
							arr = Object.keys(props).map(function(key) {
								var res = props[key];
								if (key === 'ts_utc') {
									res = new Date(1000 * res).toLocaleDateString();
								}
								return '<div>' + key + ': <b>' + res + '</b></div>';
							}),
							popup = ev.popup;
						
						popup.setContent(arr.join('\n') + '<div>lat: <b>' + _latlng.lat + '</b></div>' + '<div>lng: <b>' + _latlng.lng + '</b></div>');
					})
					// .on('remove', function () {
						//if (map._popup) map._popup.remove();
					// })
					.setIcon(myIcon);
			});
			firesOverlay.clearLayers();
			firesOverlay.addLayer(geo);
			map.spin(false);
		});
};
var updateBbox = function() {
	var screenBounds = map.getBounds(),
		p1 = screenBounds.getNorthWest(),
		p2 = screenBounds.getSouthEast();

	currentBbox = {
		type: 'Polygon',
		coordinates:[
			[
				[p1.lng, p1.lat],
				[p2.lng, p1.lat],
				[p2.lng, p2.lat],
				[p1.lng, p2.lat],
				[p1.lng, p1.lat]
			]
		]
	};
	getItems();
};
if (bboxFlag) {
	map.on('moveend', updateBbox);
	updateBbox();
} else {
	getItems();
}

var regOverlay = L.featureGroup([])
    .bindPopup()
    .on('popupopen ', function(ev) {
		//console.log('Clicked on a member of the group!', ev);
		var marker = ev.layer,
			props = marker.feature.properties,
			arr = Object.keys(props).map(function(key) {
				var res = props[key];
				if (key === 'ts_utc') {
					res = new Date(1000 * res).toLocaleDateString();
				}
				return '<div>' + key + ': <b>' + res + '</b></div>';
			}),
			popup = ev.popup;
		
		popup.setContent(arr.join('\n'));
	});
regOverlay.addLayer(L.geoJSON(irk, {
	style: function (feature) {
		return {weight: 2, fillOpacity: 0.05, color: 'blue'};
	}
}));

var protocol = location.protocol === 'file:' ? 'http:' : location.protocol,
	url = protocol + '//tilessputnik.ru/{z}/{x}/{y}.png',
	url1 = protocol + '//maps.kosmosnimki.ru/TileService.ashx?LayerName=C598DBF5726945AFBEC937E086447DBF&map=5AE44B9616754357B39802C0620B2713&crs=epsg:3857&request=getTile&apiKey=6Q81IXBUQ7&z={z}&x={x}&y={y}',
	bounds = location.search.indexOf('bounds=1') === -1,
	baseLayers = {
		// 'Карта': bounds ? L.tileLayer(url) : L.TileLayer.boundaryCanvas(url, {boundary: irk.features[0].geometry}),
		'Карта': L.tileLayer(url),
		'Спутник': L.TileLayer.boundaryCanvas(url1, {boundary: clipJSON})
	},
	overlayes = {
		'Пожары': firesOverlay,
		'Границы районов': regOverlay,
		'Кадастр': publicInterface.afterViewer({}, map)
	};

baseLayers['Карта'].addTo(map);
L.control.layers({}, overlayes).addTo(map);

L.control.iconLayers([
	{
        title: 'Карта',
        icon: './css/basemap_osm_ru.png',
        layer: baseLayers['Карта']
    },
	{
        title: 'Спутник',
        icon: './css/basemap_satellite.png ',
        layer: baseLayers['Спутник']
    }
], {position: 'bottomright'}).addTo(map);

// overlayes['Границы районов'].addTo(map);
firesOverlay.addTo(map);

// nsGmx.GmxWidgetMixin = {
var gmxWidgetMixin = {
    getContainer: function() {
        return this.el || this._container;
    },
    appendTo: function(el) {
        el = el[0] || el;
        el.appendChild(this.getContainer());
    },
    show: function() {
        var el = this.getContainer();
        el.style.display = (this._previousStyleDisplayValue !== 'none' && this._previousStyleDisplayValue) || 'block';
        delete this._previousStyleDisplayValue;
    },
    hide: function() {
        var el = this.getContainer();
        this._previousStyleDisplayValue = el.style.display;
        el.style.display = 'none';
    },
    _terminateMouseEvents: function(el) {
        el = el || this.getContainer();
        L.DomEvent.disableClickPropagation(el);
        el.addEventListener('mousewheel', L.DomEvent.stopPropagation);
        el.addEventListener('mousemove', L.DomEvent.stopPropagation);
    }
};

var CalendarContainerControl = L.Control.extend({
	includes: [gmxWidgetMixin, L.Evented ? L.Evented.prototype : L.Mixin.Events],
	onAdd: function(map) {
		var container = this._container = L.DomUtil.create('div', 'calendarContainerControl');
		container.id = 'calendar';
		this._terminateMouseEvents();

		L.DomUtil.addClass(container, 'calendarContainer_desktop');

		L.DomEvent.addListener(container, 'click', function() {
			this.fire('click');
		}, this);

		return container;
	},

	addView: function(view) {
		this._container.appendChild(view.el);
		return this;
	}
});

var calendarContainerControl = new CalendarContainerControl({
	position: 'topleft'
});

map.addControl(calendarContainerControl);

$.datepicker.regional['ru'] = {
	monthNamesShort: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
	dayNamesMin: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
	firstDay: 1,
};
$.datepicker.setDefaults($.datepicker.regional['ru']);

var calendar = new nsGmx.CalendarWidget('calendarContainer', {
	container: 'calendar',
	dateFormat: 'dd.mm.yy',
	// dateMin: new Date(Date.UTC(2011, 7, 1)),
	dateMax: dateEnd,
	dateBegin: dateBegin,
	dateEnd: dateEnd,
	minimized: true,
	showSwitcher: true,
	showTime: true
});

$(calendar).on('datechange', function() {
	dateBegin = calendar.getDateBegin();
	dateEnd = calendar.getDateEnd();
	if (dateBegin.getTime() === dateEnd.getTime()) {
		dateEnd = new Date(dateBegin.getTime() + 1000*60*60*24);
	}
	if (bboxFlag) {
		updateBbox();
	} else {
		getItems(dateBegin, dateEnd);
	}
});
