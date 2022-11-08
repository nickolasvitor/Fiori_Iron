sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/ui/core/Fragment",
	"sap/ui/core/Popup",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"./utilities",
	"./constants",
	"../model/parcelaModel",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Text",
	"sap/m/MessageToast",
	"sap/m/PDFViewer"
], function (BaseController, MessageBox, History, Fragment, Popup, JSONModel, Filter, Utilities, Constants, ParcelaModel, Dialog,
	DialogType, Button,
	ButtonType, Text, MessageToast, PDFViewer) {
	"use strict";

	return BaseController.extend("com.gcb.ironhouse.app.controller.EventsList", {

		onInit: function () {
			Utilities.setLanguagePtBrTickets(this.getView());
			this.getOwnerComponent().readLocalStorage();
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("EventsList").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		},

		handleRouteMatched: function (oEvent) {
			this._initEventsList();
		},

		_initEventsList: function () {

			var oBindings = this.getOwnerComponent().getBindingContext();
			var oModel = oBindings.getModel().getModel();
			var oData = oModel.getData();

			var oJsonModel = new JSONModel({
				"eventCount": oData.eventCount,
				"itemNotifGroup": oData.itemNotifGroup
			});

			this.getView().setModel(oJsonModel, "events");

		},

		_onItemEventsPress: function (oEvent) {

			var oSource = oEvent.getSource();
			var sPath = oSource.oBindingContexts.events.sPath;
			var oArrayPath = sPath.split("/");
			var oModelIron = this.getView().getModel("IronHouse");
			var oEventsModel = this.getView().getModel("events");
			var oData = oEventsModel.getData();
			var oDataEvent;
			var sUrl = oModelIron.sServiceUrl + "/FileSet(Token='";
			var sUrlService = sUrl + oModelIron.getHeaders().Authorization + "',";

			if (oArrayPath.length > 0) {
				oDataEvent = oData[oArrayPath[1]][oArrayPath[2]][oArrayPath[3]][oArrayPath[4]];

				sPath = oDataEvent.eventoid + ';' + oDataEvent.empcd + ';' + oDataEvent.unicd;
				sUrl = sUrlService + "Filename='" + sPath + "',Filetype='02')/$value";

				var oButtonClose = true;
				if (oDataEvent.tpEvento == Constants.cEvents.termo && oDataEvent.status == '') {
					oButtonClose = false;
				}

				var oJsonModelTerm = new JSONModel({
					"tpEvento": oDataEvent.tpEvento,
					"title": oDataEvent.title,
					"description": oDataEvent.description,
					"source": sUrl,
					"eventoid": oDataEvent.eventoid,
					"empcd": oDataEvent.empcd,
					"unicd": oDataEvent.unicd,
					"buttonClose": oButtonClose,
					"path": oArrayPath
				});

				this.getView().setModel(oJsonModelTerm, "eventsTerm");

				if (!this._eventTerm) {
					this._eventTerm = Fragment.load({
						id: this.getView().getId(),
						name: "com.gcb.ironhouse.app.view.EventTerm",
						controller: this
					}).then(function (oEventView) {
						this.getView().addDependent(oEventView);
						return oEventView;
					}.bind(this));
				}
				this._eventTerm.then(function (oEventView) {
					oEventView.open();
				});

			}

		},

		_createLogEvent: function (oDataEvent, oStatus) {

			return new Promise((fnResolve, fnReject) => {

				var oModelIH = this.getView().getModel("IronHouse");
				var oUserInfoModel = this.getView().getModel("UserInfo");
				var oDataInfoModel = oUserInfoModel.getData();
				var oBundle = this.getView().getModel("i18n").getResourceBundle();

				if (!oDataEvent.status) {

					$.getJSON('https://api.db-ip.com/v2/free/self', function (result) {

						var aData = {
							"Token": oModelIH.getHeaders().Authorization,
							"Cliente": oDataInfoModel.Id,
							"Eventoid": oDataEvent.eventoid,
							"Empcd": oDataEvent.empcd,
							"Unicd": oDataEvent.unicd,
							"Status": oStatus,
							"DataAceiteVisualizacao": new Date(),
							"IpCliente": result.ipAddress,
							"Navegador": self.clientInformation.userAgent
						};

						oModelIH.create("/LogEventoSet", aData, {
							success: function (results) {

								var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
									pattern: "EEE, MMM d, yyyy - HH:mm:ss"
								});

								oDataEvent.dataVisu = oDateFormat.format(new Date());
								oDataEvent.status = oStatus;

								if (oStatus == Constants.cStatusEvent.aceito) {
									oDataEvent.statusDesc = oBundle.getText("textStatusAceito");
								} else if (oStatus == Constants.cStatusEvent.visualizado) {
									oDataEvent.statusDesc = oBundle.getText("textStatusVisualizado");
								} else if (oStatus == Constants.cStatusEvent.recusado) {
									oDataEvent.statusDesc = oBundle.getText("textStatusRecusado");
								}

								fnResolve();
							}.bind(this),
							error: function (error) {
								fnReject();
							}
						});

					});

				} else {
					fnResolve();
				}

			});

		},

		_onTermoAceitarPress: function (oEvent) {
			var oEventsModel = this.getView().getModel("events");
			var oDataEvents = oEventsModel.getData();
			var oEventsTermModel = this.getView().getModel("eventsTerm");
			var oDataEventsTerm = oEventsTermModel.getData();
			var oArrayPath = oDataEventsTerm.path;
			var oDataEvent = oDataEvents[oArrayPath[1]][oArrayPath[2]][oArrayPath[3]][oArrayPath[4]];

			this._createLogEvent(oDataEvent, Constants.cStatusEvent.aceito).then(function () {
				oEventsModel.refresh();
			}.bind(this));

			oEvent.getSource().getParent().close();
		},

		_onTermoCancelPress: function (oEvent) {
			var oEventsModel = this.getView().getModel("events");
			var oDataEvents = oEventsModel.getData();
			var oEventsTermModel = this.getView().getModel("eventsTerm");
			var oDataEventsTerm = oEventsTermModel.getData();
			var oArrayPath = oDataEventsTerm.path;
			var oDataEvent = oDataEvents[oArrayPath[1]][oArrayPath[2]][oArrayPath[3]][oArrayPath[4]];

			this._createLogEvent(oDataEvent, Constants.cStatusEvent.recusado).then(function () {
				oEventsModel.refresh();
			}.bind(this));

			oEvent.getSource().getParent().close();
		},

		_onTermoFecharPress: function (oEvent) {
			var oEventsModel = this.getView().getModel("events");
			var oDataEvents = oEventsModel.getData();
			var oEventsTermModel = this.getView().getModel("eventsTerm");
			var oDataEventsTerm = oEventsTermModel.getData();
			var oArrayPath = oDataEventsTerm.path;
			var oDataEvent = oDataEvents[oArrayPath[1]][oArrayPath[2]][oArrayPath[3]][oArrayPath[4]];

			this._createLogEvent(oDataEvent, Constants.cStatusEvent.visualizado).then(function () {
				oEventsModel.refresh();
			}.bind(this));

			oEvent.getSource().getParent().close();
		},

		_updateEvent: function () {
			return new Promise((fnResolve, fnReject) => {
				var oEventsModel = this.getView().getModel("events");
				var oDataEvents = oEventsModel.getData();

				for (var i = 0; i < oDataEvents.itemNotifGroup.length; i++) {
					for (var j = 0; j < oDataEvents.itemNotifGroup[i].groupItems.length; j++) {
						if (!oDataEvents.itemNotifGroup[i].groupItems[j].status && !oDataEvents.itemNotifGroup[i].groupItems[j].dir) {
							this._createLogEvent(oDataEvents.itemNotifGroup[i].groupItems[j], Constants.cStatusEvent.visualizado).then(function () {}.bind(
								this));
						}
					}
				}

				fnResolve();
			});
		},

		_onPageNavButtonPress: function () {

			this._updateEvent().then(function () {

				var oHistory = History.getInstance();
				var sPreviousHash = oHistory.getPreviousHash();
				var oQueryParams = this.getQueryParameters(window.location);

				if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad) {
					window.history.go(-1);
				} else {
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter.navTo("default", true);
				}

			}.bind(this));

		},
		getQueryParameters: function (oLocation) {
			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

		}

	});
}, /* bExport= */ true);