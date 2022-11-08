sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast"
], function (BaseController, MessageBox, Utilities, History,MessageToast) {
	"use strict";

	return BaseController.extend("com.gcb.ironhouse.app.controller.RecuperarSenha", {
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
				password: "",
				passwordLengthIcon: "sap-icon://decline"
			});

			// sap-icon://accept
			this.getView().setModel(oViewModel, "ResetPassword");

		},
		_navigateToLogin: function () {

			return new Promise(function (fnResolve) {
				this.oRouter.navTo("Login");
				fnResolve();
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onPressSave: function (oEvent) {

			if (this._isInputValid() === true) {
				this._doResetPassword()
					.then(this._processResetPasswordReturn.bind(this))
					.catch(this._onResetFailed.bind(this));
			} else {
				const oBundle = this.getView().getModel("i18n").getResourceBundle();
				MessageBox.error(oBundle.getText("errorFillMandatory"));
			}
		},
		_isInputValid: function () {
			const oView = this.getView();
			let oInputPassword = oView.byId("inputPasswordId");
			let oInputConfirmPassword = oView.byId("inputConfirmPasswordId");

			let bValid = true;

			if (!oInputPassword.getValue() ||
				oInputPassword.getValue() === "") {
				bValid = false;
				oInputPassword.setValueState(sap.ui.core.ValueState.Error);
			} else {
				oInputPassword.setValueState(sap.ui.core.ValueState.None);
			}

			if (!oInputConfirmPassword.getValue() ||
				oInputConfirmPassword.getValue() === "") {
				bValid = false;
				oInputConfirmPassword.setValueState(sap.ui.core.ValueState.Error);
			} else {
				oInputConfirmPassword.setValueState(sap.ui.core.ValueState.None);
			}
			
			if (bValid === true) {
				if (oInputPassword.getValue() !== oInputConfirmPassword.getValue()) {
					bValid = false;
					oInputPassword.setValueState(sap.ui.core.ValueState.Error);
					oInputConfirmPassword.setValueState(sap.ui.core.ValueState.Error);
				}
			}
			
			return bValid;
		},
		_doResetPassword: function () {
			let oModel = this.getView().getModel("IronHouse");
			let oResetPasswordModel = this.getView().getModel("ResetPassword");

			let oHash = this.oRouter.getRouteInfoByHash(this.oRouter.getHashChanger().getHash());
			oResetPasswordModel.oData.resetKey = oHash.arguments.resetKey;
			oModel.oHeaders["Accept-Language"] = "pt";
			return new Promise((fnResolve, fnReject) => {
				oModel.callFunction("/ChangePassword", {
					method: "POST", // http method
					urlParameters: oResetPasswordModel.oData,
					success: (oData, oResponse) => { // callback function for success
						fnResolve(oData, oResponse);
					},
					error: (oData) => {
						fnReject(oData);
					}
				});
			});
		},
		_processResetPasswordReturn: function (oResult) {

			return new Promise((fnResolve, fnReject) => {				
				if (oResult != null) {
					if (oResult.type === 'S') {
						this.oRouter.navTo("Login");
						const oBundle = this.getView().getModel("i18n").getResourceBundle();
						const sNewPassword = oBundle.getText("newPassword");
						MessageBox.show(oResult.message,{title:sNewPassword});					
					}
					else {
						MessageBox.error(oResult.message);
					}
					fnResolve(oResult);
				}
				else {
					//show error
					fnReject(oResult.message);
				}
			});
		},
		_onResetFailed: function (oResult) {
			this.oRouter.navTo("Login");
			if (oResult.message) {
				MessageBox.error(oResult.message);
			} else {
				const oBundle = this.getView().getModel("i18n").getResourceBundle();
				MessageBox.error(oBundle.getText("errorCommunicationFailed"));
			}
		},
		_onChangePassword: function(oEvent){
			let oIcon = this.getView().ById("iconPasswordLengthId");
			
				
		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("RecuperarSenha").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		}
	});
}, /* bExport= */ true);
