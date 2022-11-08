sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/model/Sorter",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/UploadCollectionItem",
	"sap/m/ObjectAttribute"
], function (BaseController, MessageBox, Utilities, History, Sorter, MessageToast, JSONModel, UploadCollectionItem, ObjectAttribute) {

	return BaseController.extend("com.gcb.ironhouse.app.controller.Ticket", {
		handleRouteMatched: function (oEvent) {

			var oParams = {};
			let oParamData = oEvent.getParameter("data");
			let sEntityNameSet = "ServiceRequestCollection('" + oParamData.ticketId + "')";

			let oPath;
			let sParentPath;
			if (sEntityNameSet) {
				sParentPath = "C4CSERVICE_SRV>/" + sEntityNameSet;
				oPath = {
					path: sParentPath + "/ServiceRequestTextCollection",
					parameters: oParams
				};

				this._initTicketFeedList(oPath.path);
				this._initAttachmentsList();
				this.getView().bindObject(sParentPath);
				this._setFeedListBusy();
				this._readInterations();
				this._readAttachments();

			}
		},
		_readInterations: function () {

			this._readInterationsAsync()
				.then(this._processOnReadResult.bind(this))
				.catch(this._onError.bind(this));
		},
		_initTicketFeedList: function (sPath) {

			let oEmptyData = {};
			this._setDataFeedListModel(oEmptyData);

			let oItemTemplate = this._buildFeedListTemplate();

			let aSorters = [];
			aSorters.push(new Sorter("CreatedOn", true));

			let oBindingInfo = {
				"path": "FeedList>/text",
				"sorter": aSorters,
				template: oItemTemplate
			};

			let oList = this.getView().byId("listFeedId");
			oList.bindItems(oBindingInfo);
		},
		_readInterationsAsync: function () {
			let oModel = this.getView().getModel("C4CSERVICE_SRV");
			let sPath = this.getView().getObjectBinding("C4CSERVICE_SRV").getPath();

			return new Promise((fnResolve, fnReject) => {
				oModel.read(sPath, {
					urlParameters: {
						"$expand": "ActivityServiceRequestInteraction/ActivityText,ServiceRequestText"
					},
					success: (oData, oResponse) => {
						fnResolve(oData, oResponse);

					},
					error: (oData) => {
						fnReject(oData);
						this.onError(oData);
					}
				});
			});

		},
		_buildFeedListTemplate: function () {

			let oItemTemplate = new sap.m.FeedListItem({
				"text": "{FeedList>Text}",
				"icon": "sap-icon://personnel-view",
				"timestamp": {
					"path": "FeedList>CreatedOn",
					"type": "sap.ui.model.type.DateTime",
					"formatOptions": {
						"relative": true,
						"relativeScale": "auto"
					}
				},
				"sender": {
					"path": "FeedList>CreatedBy"
				},
				"senderActive": false,
				"iconActive": false
			});

			return oItemTemplate;
		},
		_processOnReadResult: function (oData) {
			this._setFeedListBusy();

			if (!oData) {
				return;
			}

			let aFeedList = [];

			// Text Collection
			if (oData.ServiceRequestText) {
				for (const oText of oData.ServiceRequestText) {
					let oFeedListItem = {};
					oFeedListItem.Text = oText.Text;
					oFeedListItem.CreatedOn = oText.CreationDateTime;
					if (oData.BuyerPartyUUID === oText.AuthorUUID) {
						oFeedListItem.CreatedBy = oData.FormattedName;
					} else {
						oFeedListItem.CreatedBy = oText.CreatedBy;
					}
					aFeedList.push(oFeedListItem);
				}
			}

			// Email Collection
			if (oData.ActivityServiceRequestInteraction) {
				for (const oRequestInteraction of oData.ActivityServiceRequestInteraction) {
					if (oRequestInteraction.ActivityText) {
						for (const oActivityText of oRequestInteraction.ActivityText) {
							let oFeedListItem = {};
							oFeedListItem.Text = oActivityText.Text;
							oFeedListItem.CreatedOn = oActivityText.CreatedOn;
							oFeedListItem.CreatedBy = oActivityText.CreatedBy;
							aFeedList.push(oFeedListItem);
						}
					}
				}
			}

			this._setDataFeedListModel(aFeedList);

		},
		_setDataFeedListModel: function (oData) {
			let oModel = new JSONModel({
				"text": oData
			});
			this.getView().setModel(oModel, "FeedList");
		},
		_onPageNavButtonPress: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			var sHash = this.oRouter.getHashChanger().getHash();
			var oQueryParams = this.getQueryParameters(window.location);

			let aAttachmentList = [];	
			this._setDataAttachmentList(aAttachmentList);	
	
			if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad || sHash) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("default", true);
			}

		},
		getQueryParameters: function (oLocation) {
			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

		},
		_onButtonPress: function (oEvent) {

			oEvent = jQuery.extend(true, {}, oEvent);
			return new Promise(function (fnResolve) {
					fnResolve(true);
				})
				.then(function (result) {
					return new Promise(function (fnResolve) {
						var sTargetPos = "";
						sTargetPos = (sTargetPos === "default") ? undefined : sTargetPos;
						sap.m.MessageToast.show("O ticket foi encerrado!", {
							onClose: fnResolve,
							duration: 3000 || 3000,
							at: sTargetPos,
							my: sTargetPos
						});
					});

				}.bind(this))
				.then(function (result) {
					if (result === false) {
						return false;
					} else {
						var oHistory = History.getInstance();
						var sPreviousHash = oHistory.getPreviousHash();
						var oQueryParams = this.getQueryParameters(window.location);

						if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad) {
							window.history.go(-1);
						} else {
							var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
							oRouter.navTo("default", true);
						}

					}
				}.bind(this)).catch(function (err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});
		},
		_onAnswer: function (oEvent) {
			let oView = this.getView();
			let oContext = oView.getBindingContext("C4CSERVICE_SRV");
			let sServiceTextCollectionPath = "/ServiceRequestText";
			let sPath = oContext.getPath() + sServiceTextCollectionPath;
			let oModel = oView.getModel("C4CSERVICE_SRV");
			let sAnswer = oEvent.getSource().getValue();
			const sBuyerPartyUUID = oContext.getProperty("BuyerPartyUUID");

			this._setFeedListBusy();

			let oData = {
				"properties": {
					"TypeCode": "10007",
					"Text": sAnswer,
					"AuthorUUID": sBuyerPartyUUID
				}
			};

			oModel.createEntry(sPath, oData);
			oModel.submitChanges({
				success: (oData, oResult) => {
					this._onAnswerResultSuccess(oData, oResult);
				},
				error: (oData) => {
					this._onError(oData);
				}
			});
		},
		_onAnswerResultSuccess: function (oData, oResult) {
			this._readInterations();
			let oBundle = this.getView().getModel("i18n").getResourceBundle();
			let sAnswerMsg = oBundle.getText("answerSentSuccess");
			MessageToast.show(sAnswerMsg);
		},
		_onError: function (oData) {
			this._setFeedListBusy();
			let oBundle = this.getView().getModel("i18n").getResourceBundle();
			let sAnswerMsg = oBundle.getText("errorAnswerError");
			MessageBox.error(sAnswerMsg);
		},
		_setFeedListBusy: function () {
			let oList = this.getView().byId("listFeedId");
			oList.setBusy(!oList.getBusy());
		},
		_initAttachmentsList: function () {
			
			let aAttachmentList = [];	
			this._setDataAttachmentList(aAttachmentList);
			
			let oTemplate = this._buildAttachmentListTemplate();

			let oUploadCollection = this.getView().byId("uploadCollectionId");
			let sPath = "AttachmentList>/files";
			let oBindingInfo = {
				path: sPath,
				template: oTemplate,
				templateShareable: false
			};

			oUploadCollection.bindItems(oBindingInfo);

		},
		_buildAttachmentListTemplate: function () {

			let oAttributeTemplate = this._buildAttachmentAttributeTemplate();

			let oAttachmentTemplate = new UploadCollectionItem({
				"fileName": "{AttachmentList>fileName}",
				"mimeType": "{AttachmentList>mimeType}",
				"url": "{AttachmentList>url}",
				"visibleDelete": false,
				"visibleEdit": false
			});

			oAttachmentTemplate.bindAttributes({
				path: "AttachmentList>attributes",
				template: oAttributeTemplate,
				templateShareable: false
			});

			return oAttachmentTemplate;
		},
		_buildAttachmentAttributeTemplate: function () {
			return new ObjectAttribute({
				"title": "{AttachmentList>title}",
				"text": "{AttachmentList>text}",
				"active": "{AttachmentList>active}"
			});
		},
		_readAttachments: function () {
			this._readAttachmentsAsync()
				.then(this._processOnReadAttachmentsResult.bind(this))
				.catch(this._onError.bind(this));
		},
		_readAttachmentsAsync: function () {
			let oModel = this.getView().getModel("C4CSERVICE_SRV");
			let sPath = this.getView().getObjectBinding("C4CSERVICE_SRV").getPath();
			sPath = sPath + "/ServiceRequestAttachmentFolder";
			const sSelect = "Name,SizeInkB,MimeType,DocumentLink,CreatedOn";
			return new Promise((fnResolve, fnReject) => {
				oModel.read(sPath, {
					urlParameters: {
						"$select": sSelect
					},
					success: (oData, oResponse) => {
						fnResolve(oData, oResponse);

					},
					error: (oData) => {
						fnReject(oData);
						this.onError(oData);
					}
				});
			});
		},
		_processOnReadAttachmentsResult: function (oData) {
			
			let oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance();
			let aAttachmentList = [];
			let oBundle = this.getView().getModel("i18n").getResourceBundle();

			if (oData.results){				
				
				for (const oResult of oData.results) {

					let aAttributes = [];
		
					// CreateOn Attribute
					let oCreateOnAttribute = {
						"title": oBundle.getText("createOn"),
						"text": oDateFormat.format(oResult.CreatedOn),
						"active": false
					};

					aAttributes.push(oCreateOnAttribute);

					let oAttachmentFile = {
						"fileName": oResult.Name,						
						"mimeType": oResult.MimeType,
						"url": this._normalizeAttachmentUrl(oResult.DocumentLink),
						"createOn": oResult.CreatedOn,
						"attributes": aAttributes
					};										
					aAttachmentList.push(oAttachmentFile);
				}
			}

			let oJSONModel = new JSONModel({"files":aAttachmentList});
			this.getView().setModel(oJSONModel,"AttachmentList");
		},
		_normalizeAttachmentUrl: function (sUrl) {
			let sServiceUrl = this.getView().getModel("C4CSERVICE_SRV").sServiceUrl;
			let aSplitUrl = sUrl.split(sServiceUrl);
			if (aSplitUrl.length > 0) {
				return sServiceUrl + aSplitUrl[1];
			}
			return "";
		},
		_setDataAttachmentList: function (aAttachmentList) {
			let oJSONModel = new JSONModel({
				"files": aAttachmentList
			});
			this.getView().setModel(oJSONModel, "AttachmentList");
		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.getOwnerComponent().readLocalStorage();
			this.oRouter.getTarget("Ticket").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		}
	});
}, /* bExport= */ true);