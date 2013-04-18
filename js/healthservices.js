
// "Legevakter" is a Parse.js Backbone application
$(function() {

	Parse.$ = jQuery;

	// Initialize Parse
	Parse.initialize("b8miWZyVIuwxB47cjOTa6ik6B5DiaO4bnZeVQgNA", 
		"Xo3H0UKj36YYTZCo3fNmIvaOP5eAwIdr5XMUeZkH");

	// HealthService model
	// -------------------

	var HealthService = Parse.Object.extend("HealthService", {

	});

	var AppState = Parse.Object.extend("AppState", {
		defaults: {

		}
	});

	// HealthService Collection
	// ------------------------
	var HealthServiceList = Parse.Collection.extend({
		model: HealthService
	});

	// HealthService View
	// ------------------
	var HealthServiceView = Parse.View.extend({

		//... is a list tag
		tagName: "li",

		// Cache the template function for a single health service
		template: _.template($('#health-service-template').html()),

		initialize: function() {
			_.bindAll(this, 'render');
		},

		// Re-render the contents
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		}
	});

	// The Application
	// ---------------

	// Health Services Near You
	var HealthServicesNearYou = Parse.View.extend({
		el: ".content",

		initialize: function() {
			var self = this;

			_.bindAll(this, 'addOne', 'addAll', 'render');

			// Template
			this.$el.html(_.template($("#health-services-near-you-template").html()));

			this.healthServices = new HealthServiceList();

			this.healthServices.bind('add', this.addOne);
			this.healthServices.bind('reset', this.addAll);
			this.healthServices.bind('all', this.render);


			Parse.GeoPoint.current({
				success: function(geoPoint) {

					self.healthServices.query = new Parse.Query(HealthService);
					self.healthServices.query.withinKilometers("geoPoint", geoPoint, 25);

					self.healthServices.fetch();
				},
				error: function(error) {
					console.log("Error: " + error);

					self.healthServices.query = new Parse.Query(HealthService);
					self.healthServices.query.limit(10);

					self.healthServices.fetch();
				}
			});

		},

		render: function() {
			this.delegateEvents();
		},

		addOne: function(healthService) {
			var view = new HealthServiceView({model: healthService});
			this.$("#health-services-list").append(view.render().el);
		},
		addAll: function(collection, filter) {
			this.$("#health-services-list").html("");
			this.healthServices.each(this.addOne);
		}
	});

	// Main view for the app
	var AppView = Parse.View.extend({
		el: $("#healthserviceapp"),

		initialize: function() {
			this.render();
		},

		render: function() {
			new HealthServicesNearYou();
		}
	});

  	var AppRouter = Parse.Router.extend({
    	routes: {
      	"all": "all",
      	"active": "active",
      	"completed": "completed"
    	},

    	initialize: function(options) {
    	},

    	all: function() {
    	  state.set({ filter: "all" });
    	},

    	active: function() {
    	  state.set({ filter: "active" });
    	},

    	completed: function() {
    	  state.set({ filter: "completed" });
    	}
  	});

	var state = new AppState;

	new AppRouter;
	new AppView;
	Parse.history.start();
});
