sap.ui.define([
	"./constants"
], function () {
	"use strict";

	// class providing static utility methods to retrieve entity default values.
	const cPrcSit = {
		PLANEJADA: '1',
		AGUARDANDO_PAGAMENTO: '2',
		PAGA: "3",
		EM_ATRASO: "4",
		CANCELADA: "9"
	};
	const cEvents = {
		aviso: "1",
		termo: "2"
	};
	const cStatusEvent = {
		visualizado: "2",
		aceito: "3",
		recusado: "4"
	};
	return {
		cPrcSit,
		cEvents,
		cStatusEvent
	};

});