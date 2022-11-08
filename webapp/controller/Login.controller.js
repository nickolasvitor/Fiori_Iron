sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/ui/Device",
	"sap/m/MessageBox",
	"./utilities",
	"./constants",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/library",
	"sap/ui/core/Fragment"
], function (BaseController, Device, MessageBox, Utilities, Constants, MessageToast, JSONModel, mobileLibrary, Fragment) {
	"use strict";
	return BaseController.extend("com.gcb.ironhouse.app.controller.Login", {
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
				adm: ""
			});

			this.getView().setModel(oViewModel, "login");

			this._setInputValueStateToNone();

		},
		_setInputValueStateToNone: function () {
			const oView = this.getView();
			let oInputDocument = oView.byId("inputDocumentId");
			let oInputPassword = oView.byId("inputPasswordId");
			oInputDocument.setValueState(sap.ui.core.ValueState.None);
			oInputPassword.setValueState(sap.ui.core.ValueState.None);

		},
		_onPressFirstAccess: function (oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function (fnResolve) {

				this.doNavigate("PrimeiroAcesso", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
					sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function (bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		_onPressPasswordRecovery: function (oEvent) {

			if (this._isInputValidPasswordRecovery() === true) {
				this._setViewBusy();
				this._doPasswordRecovery()
					.then(this._processPasswordRecoveryReturn.bind(this))
					.catch(this._onRequestFailed.bind(this));
			} else {
				const oBundle = this.getView().getModel("i18n").getResourceBundle();
				MessageBox.error(oBundle.getText("errorFillMandatory"));
			}
		},
		_setViewBusy: function () {
			let oView = this.getView();
			oView.setBusy(!oView.getBusy());
		},
		_isInputValidPasswordRecovery: function () {
			const oView = this.getView();
			let oInputDocument = oView.byId("inputDocumentId");

			let bValid = true;

			if (this._isInputFilled(oInputDocument) === true) {
				oInputDocument.setValueState(sap.ui.core.ValueState.None);
			} else {
				bValid = false;
				oInputDocument.setValueState(sap.ui.core.ValueState.Error);
			}

			return bValid;

		},
		_isInputFilled: function (oInput) {
			if (!oInput.getValue() || oInput.getValue() === "") {
				return false;
			} else {
				return true;
			}
		},
		_doPasswordRecovery: function () {
			let oModel = this.getView().getModel("IronHouse");
			let oLoginModel = this.getView().getModel("login");
			let oResetPassParameters = {};

			oResetPassParameters.document = oLoginModel.oData.document.replace(/\D/g, '');

			return new Promise((fnResolve, fnReject) => {
				oModel.callFunction("/ResetPassword", {
					method: "POST", // http method
					urlParameters: oResetPassParameters,
					success: (oData, oResponse) => { // callback function for success
						fnResolve(oData, oResponse);
					},
					error: (oData) => {
						fnReject(oData);
					}
				});
			});
		},
		_processPasswordRecoveryReturn: function (oData, oResponse) {
			return new Promise((fnResolve, fnReject) => {
				if (oData != null && oData.type === 'S') {
					this._setViewBusy();
					const oBundle = this.getView().getModel("i18n").getResourceBundle();
					MessageBox.show(oData.message, {
						title: oBundle.getText("recoveryPassword")
					});
					fnResolve(oData, oResponse);
				} else {
					//show error
					fnReject(oData, oResponse);
				}
			});
		},
		_onPressLogin: function (oEvent) {
			let oBindingContext = oEvent.getSource().getBindingContext();
			let that = this;

			if (this._isInputValidLogin() === true) {
				this._setViewBusy();
				this._doLogin(oBindingContext)
					.then(that._processLoginReturn.bind(that))
					.then(that._getUserInfo.bind(that))
					.then(that._processUserInfo.bind(that))
					.then(that._loadUnits.bind(that))
					//.then(that._navigateToResumo.bind(that))
					.catch(that._onRequestFailed.bind(that));
			} else {
				const oBundle = this.getView().getModel("i18n").getResourceBundle();
				MessageBox.error(oBundle.getText("errorFillMandatory"));
			}
		},
		_isInputValidLogin: function () {
			const oView = this.getView();
			let oInputDocument = oView.byId("inputDocumentId");
			let oInputPassword = oView.byId("inputPasswordId");

			let bValid = true;

			if (this._isInputFilled(oInputDocument) === true) {
				oInputDocument.setValueState(sap.ui.core.ValueState.None);
			} else {
				bValid = false;
				oInputDocument.setValueState(sap.ui.core.ValueState.Error);
			}

			if (this._isInputFilled(oInputPassword) === true) {
				oInputPassword.setValueState(sap.ui.core.ValueState.None);
			} else {
				bValid = false;
				oInputPassword.setValueState(sap.ui.core.ValueState.Error);
			}

			return bValid;

		},
		_doLogin: function (oBindingContext) {

			let oModel = this.getView().getModel("IronHouse");
			let oLoginModel = this.getView().getModel("login");

			oLoginModel.oData.document = oLoginModel.oData.document.replace(/\D/g, '');

			return new Promise((fnResolve, fnReject) => {
				oModel.callFunction("/Login", {
					method: "POST", // http method
					urlParameters: oLoginModel.oData,
					success: (oData, response) => { // callback function for success
						fnResolve(oData, oBindingContext);
					},
					error: (oData) => {
						fnReject(oData);
					}
				});
			});
		},
		_processLoginReturn: function (oResult) {
			return new Promise((fnResolve, fnReject) => {
				if (oResult != null && oResult.sessionId != null && oResult.sessionId != '') {
					let oModel = this.getView().getModel("IronHouse");
					let oOwner = this.getOwnerComponent();
					oOwner.setIronHouseAuthorizationHeader(oResult.sessionId);
					oModel.setHeaders({
						"Authorization": oResult.sessionId
					});
					fnResolve(oResult.userId);
				} else {
					//show error
					fnReject(oResult);
				}
			});

		},
		_processUserInfo: function (oResult) {
			return new Promise((fnResolve, fnReject) => {
				if (oResult != null && oResult.Id != null && oResult.Id != '') {

					let oOwner = this.getOwnerComponent();
					oOwner.setUserInfo(oResult);
					fnResolve(oResult);
				} else {
					//show error
					fnReject(oResult.message);
				}
			});
		},
		_getUserInfo: function (sUserId) {
			let oModel = this.getView().getModel("IronHouse");
			return new Promise((fnResolve, fnReject) => {
				let sPath = "/UsuarioSet('" + sUserId + "')";
				oModel.read(sPath, {
					success: (oData) => fnResolve(oData),
					error: (oData) => fnReject(oData)
				});
			});
		},
		_navToResume: function (oId) {

			if (oId) {
				//redirect
				try {
					return new Promise((fnResolve) => {

						this.oRouter.navTo("Resumo", {
							userId: oId
						});
						this._setViewBusy();
						fnResolve();
					});
				} catch (err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				}
			} else {
				this._setViewBusy();
			}
		},
		_navigateToResumo: function (oUserInfo) {

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var oUserInfoModel = this.getView().getModel("UserInfo");
			var oDataInfoModel = oUserInfoModel.getData();

			if (oDataInfoModel.UserAdm == true) {
				this._navToResume(oDataInfoModel.Id);
			} else {
				var oModel = this.getView().getModel("eventsTerm");
				var oData = oModel.getData();

				if (this._eventTerm) {
					this._eventTerm.then(function (oEvent) {
						oEvent.close();
					});
				}

				if (oData.refused == false) {
					this._navToResume(oUserInfo);
				} else {

					var oIndex = oData.indexRefused;
					var oDataEvent = oData.events[oIndex];
					var sMessage = oDataEvent.eventoid + " - " + oDataEvent.title;

					sap.m.MessageBox.information(oBundle.getText("messageBlockLoginEvento", sMessage));
					this._setViewBusy();

				}
			}

		},
		_onRequestFailed: function (oResult) {
			this._setViewBusy();
			MessageBox.error(oResult.message);
		},
		onChangeDocument: function (oEvent) {
			let oSource = oEvent.getSource();
			let sValue = oSource.getValue();
			let sFormatedValue = Utilities.formatCnpjCpf(sValue);
			oSource.setValue(sFormatedValue);
		},
		_loadUnits: function (sUserId) {
			return new Promise((fnResolve, fnReject) => {
				let oView = this.getView();
				let oModel = oView.getModel("IronHouse");
				let oUserInfoModel = oView.getModel("UserInfo");
				let oDataInfoModel = oUserInfoModel.getData();
				let sPath = "/UnidadeSet";
				let aFilters = [];

				if (sUserId.Id && oDataInfoModel.UserAdm == false) {

					aFilters.push(new sap.ui.model.Filter("Kunnr", sap.ui.model.FilterOperator.EQ, sUserId.Id));

					oModel.read(sPath, {
						filters: aFilters,
						success: (oResult) => {

							this._processLoadUnitsResult(oResult).then(function () {
								fnResolve();
							}.bind(this));

						},
						error: (oResult) => {
							fnReject(oResult);
						}
					});
				} else {
					fnResolve();
					this._navToResume(sUserId.Id);
				}
			});
		},
		_processLoadUnitsResult: function (oData) {

			return new Promise((fnResolve, fnReject) => {

				if (oData.results) {

					let oJsonModel = new JSONModel({
						"unitCount": oData.results.length
					});

					this.getView().setModel(oJsonModel, "unit");

					this._loadEvents(oData).then(function () {
						fnResolve();
					}.bind(this));

				}

			});
		},
		_loadEvents: function (oData) {

			return new Promise((fnResolve, fnReject) => {
				var oView = this.getView();
				var oModel = oView.getModel("IronHouse");
				var sPath = "/EventoSet";
				var aFilters = [];

				if (oData.results.length > 0) {

					aFilters.push(new sap.ui.model.Filter({
						path: 'Cliente',
						operator: sap.ui.model.FilterOperator.EQ,
						value1: oData.results[0].Kunnr
					}));

					for (var i = 0; i < oData.results.length; i++) {

						aFilters.push(new sap.ui.model.Filter({
							path: 'Empcd',
							operator: sap.ui.model.FilterOperator.EQ,
							value1: oData.results[i].EmpCod
						}));

					}

					oModel.read(sPath, {
						filters: aFilters,
						success: (oResult) => {
							this._processLoadEventsResult(oResult).then(function () {
								fnResolve();
							}.bind(this));
						},
						error: (oResult) => {
							fnReject(oResult);
						}
					});

				}

			});

		},
		_processLoadEventsResult: function (oData) {

			return new Promise((fnResolve, fnReject) => {

				var oEvents = [];
				var oRefused = false;
				var oIndex = 0;

				if (oData.results) {
					if (oData.results.length > 0) {

						var oJsonModel = new JSONModel({
							"eventCount": oData.results.length,
							"results": oData.results
						});

						var oModelIron = this.getView().getModel("IronHouse");
						var sUrl = oModelIron.sServiceUrl + "/FileSet(Token='";
						var sUrlService = sUrl + oModelIron.getHeaders().Authorization + "',";

						for (var i = 0; i < oData.results.length; i++) {

							if (oData.results[i].TpEvento == Constants.cEvents.termo &&
								oData.results[i].AcessoPortal == "X") {

								var sPath = oData.results[i].Eventoid + ';' + oData.results[i].Empcd + ';' + oData.results[i].Unicd;
								sUrl = sUrlService + "Filename='" + sPath + "',Filetype='02')/$value";

								var aData = {
									"empcd": oData.results[i].Empcd,
									"eventoid": oData.results[i].Eventoid,
									"description": oData.results[i].Text,
									"title": oData.results[i].Titulo,
									"unicd": oData.results[i].Unicd,
									"tpEvento": oData.results[i].TpEvento,
									"acessoPortal": oData.results[i].AcessoPortal,
									"source": sUrl
								};

								if ((oData.results[i].ApresentarTermo == "X" && oData.results[i].Status == Constants.cStatusEvent.recusado) ||
									!oData.results[i].Status) {
									oEvents.push(aData);
								}

								if (oData.results[i].ApresentarTermo == "" && oData.results[i].Status == Constants.cStatusEvent.recusado) {
									oEvents.push(aData);
									oRefused = true;
									oIndex = oEvents.length - 1;
									break;
								}

							}

						}
					}
				}

				var oJsonModelTerm = new JSONModel({
					"index": 0,
					"title": "",
					"description": "",
					"source": "",
					"tpEvento": "",
					"refused": oRefused,
					"indexRefused": oIndex,
					"buttonClose": false,
					"events": oEvents,
					"logEvents": []
				});

				this.getView().setModel(oJsonModelTerm, "eventsTerm");
				this.showEvent();
				fnResolve();

			});

		},
		showEvent: function () {

			var oModel = this.getView().getModel("eventsTerm");
			var oData = oModel.getData();
			var oUserInfoModel = this.getView().getModel("UserInfo");
			var oDataInfoModel = oUserInfoModel.getData();

			if (oData.events.length > 0 && oData.refused == false) {

				var oIndex = oData.index;
				var oDataEvent = oData.events[oIndex];

				if (oData.index == oData.events.length) {
					this._navigateToResumo(oDataInfoModel.Id);
				} else {

					oModel.setProperty("/tpEvento", oDataEvent.tpEvento);
					oModel.setProperty("/title", oDataEvent.title);
					oModel.setProperty("/description", oDataEvent.description);
					oModel.setProperty("/source", oDataEvent.source);
					oModel.setProperty("/acessoPortal", oDataEvent.acessoPortal);
					oModel.setProperty("/index", oIndex);

					if (!this._eventTerm) {
						this._eventTerm = Fragment.load({
							id: this.getView().getId(),
							name: "com.gcb.ironhouse.app.view.EventTerm",
							controller: this
						}).then(function (oEvent) {
							this.getView().addDependent(oEvent);
							return oEvent;
						}.bind(this));
					}
					this._eventTerm.then(function (oEvent) {
						oEvent.open();
					});

				}

			} else {
				this._navigateToResumo(oDataInfoModel.Id);
			}

		},
		_createLogEvent: function (oStatus) {

			return new Promise((fnResolve, fnReject) => {

				var oModelIH = this.getView().getModel("IronHouse");
				var oModel = this.getView().getModel("eventsTerm");
				var oData = oModel.getData();
				var oItem = oData.logEvents;
				var oIndex = oData.index;
				var oDataEvent = oData.events[oIndex];
				var oUserInfoModel = this.getView().getModel("UserInfo");
				var oDataInfoModel = oUserInfoModel.getData();

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

					oItem.push(aData);
					oModel.setProperty("logEvents", oItem);

					oModelIH.create("/LogEventoSet", aData, {
						success: function (results) {
							fnResolve();
						}.bind(this),
						error: function (error) {
							fnResolve();
						}
					});

				});

			});

		},
		_onTermoCancelPress: function (oEvent) {
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var oModel = this.getView().getModel("eventsTerm");
			var oData = oModel.getData();
			var oIndex = oData.index + 1;

			if (oData.acessoPortal == "X") {

				sap.m.MessageBox.show(
					oBundle.getText("messageRecusaEvento"), {
						icon: sap.m.MessageBox.Icon.WARNING,
						actions: [sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.YES],
						onClose: function (oAction) {
							if (oAction === sap.m.MessageBox.Action.YES) {

								this._createLogEvent(Constants.cStatusEvent.recusado).then(function () {
									oModel.setProperty("/refused", true);
									oModel.setProperty("/indexRefused", oData.index);
									oModel.setProperty("/index", oIndex);
									this.showEvent();
								}.bind(this));

							}
						}.bind(this)
					}
				);

			} else {
				this._createLogEvent(Constants.cStatusEvent.recusado).then(function () {
					oModel.setProperty("/index", oIndex);
					oEvent.getSource().getParent().close();
					this.showEvent();
				}.bind(this));
			}

		},
		_onTermoAceitarPress: function (oEvent) {

			var oModel = this.getView().getModel("eventsTerm");
			var oData = oModel.getData();
			var oIndex = oData.index + 1;

			oEvent.getSource().getParent().close();

			this._createLogEvent(Constants.cStatusEvent.aceito).then(function () {
				oModel.setProperty("/index", oIndex);
				this.showEvent();
			}.bind(this));

		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("Login").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

			var bIsPhone = Device.system.phone;
			var ImageMode = mobileLibrary.ImageMode;
			this.getView().setModel(new JSONModel({
				imageHeight: bIsPhone ? "auto" : "auto",
				imageWidth: bIsPhone ? "100%" : "100%",
				imageMode: sap.m.ImageMode.Background,
				imageVisible: bIsPhone ? false : true,
				imageBackgroundSize: "100%"
			}));
		}
	});
}, /* bExport= */ true);