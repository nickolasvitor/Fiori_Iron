sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast"
], function (BaseController, MessageBox, Utilities, History, MessageToast) {
	"use strict";

	return BaseController.extend("com.gcb.ironhouse.app.controller.PrimeiroAcesso", {
			handleRouteMatched: function (oEvent) {
				var sAppId = "App5eaab451eee32a0c35fcc9dc";

				var oParams = {};

				let oContext = oEvent.getParameter("data").context;
				if (oContext) {
					this.sContext = oContext;

				} else {
					if (this.getOwnerComponent().getComponentData()) {
						var patternConvert = function (oParam) {
							if (Object.keys(oParam).length !== 0) {
								for (var prop in oParam) {
									if (prop !== "sourcePrototype" && prop.includes("Set")) {
										return prop + "(" + oParam[prop][0] + ")";
									}
								}
							}
						};

						this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

					}
				}

				var oPath;

				if (this.sContext) {
					oPath = {
						path: "/" + this.sContext,
						parameters: oParams
					};
					this.getView().bindObject(oPath);
				}

				var oViewModel = new sap.ui.model.json.JSONModel({
					document: ''
				});

				this.getView().setModel(oViewModel, "first");

			},
			_onPressFirstAccess: function (oEvent) {
				if (this._isInputValid()) {
					this._doFirstAccess()
						.then(this._processFirstAccessResult.bind(this))
						.catch(this._onFirstAccessFailed.bind(this));
				} else {
					const oBundle = this.getView().getModel("i18n").getResourceBundle();
					MessageBox.error(oBundle.getText("errorFillMandatory"));
				}
			},
			_doFirstAccess: function () {
				let oModel = this.getView().getModel("IronHouse");
				let oFirstModel = this.getView().getModel("first");

				oFirstModel.oData.document = oFirstModel.oData.document.replace(/\D/g, '');

				return new Promise((fnResolve, fnReject) => {
					oModel.callFunction("/SignUp", {
						method: "POST", // http method
						urlParameters: oFirstModel.oData,
						success: (oData, oResponse) => {
							fnResolve(oData, oResponse);
						},
						error: (oData) => {
							fnReject(oData);
						}
					});
				});
			},
			_processFirstAccessResult: function (oData, oResponse) {
				this.oRouter.navTo("Login");
				if (oData != null && oData.type != null && oData.type == 'S') {
					const oBundle = this.getView().getModel("i18n").getResourceBundle();
					const sTitleFistAccess = oBundle.getText("firstAccess");
					MessageBox.show(oData.message,{title: sTitleFistAccess});				
				} else {
					MessageBox.error(oData.message);
				}
			},
		_isInputValid: function () {
			const oView = this.getView();
			let oInputDocument = oView.byId("inputDocumentId");

			let bValid = true;

			if (!oInputDocument.getValue() ||
				oInputDocument.getValue() === "") {
				bValid = false;
				oInputDocument.setValueState("Error");
			} else {
				oInputDocument.setValueState("None");
			}

			return bValid;
		},
		_onFirstAccessFailed: function (oResult) {
			this.oRouter.navTo("Login");
			if (oResult.message) {
				MessageBox.error(oResult.message);
			} else {
				const oBundle = this.getView().getModel("i18n").getResourceBundle();
				MessageBox.error(oBundle.getText("errorCommunicationFailed"));
			}
		},
		_onChangeDocument: function (oEvent) {
			let oSource = oEvent.getSource();
			let sValue = oSource.getValue();
			let sFormatedValue = Utilities.formatCnpjCpf(sValue);
			oSource.setValue(sFormatedValue);
		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("PrimeiroAcesso").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		}
	});
}, /* bExport= */ true);