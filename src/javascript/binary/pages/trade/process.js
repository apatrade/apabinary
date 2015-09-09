/*
 * This function process the active symbols to get markets
 * and underlying list
 */
function processActiveSymbols() {
    'use strict';

    // populate the Symbols object
    Symbols.details(JSON.parse(sessionStorage.getItem('active_symbols')));

    var market = getDefaultMarket();

    // store the market
    sessionStorage.setItem('market', market);

    displayOptions('contract_markets', getAllowedMarkets(Symbols.markets()), market);
    processMarket();
}


/*
 * Function to call when market has changed
 */
function processMarket() {
    'use strict';

    // we can get market from sessionStorage as allowed market
    // is already set when this function is called
    var market = sessionStorage.getItem('market');
    displayOptions('underlying', Symbols.underlyings()[market]);

    processMarketUnderlying();
}

/*
 * Function to call when underlying has changed
 */
function processMarketUnderlying() {
    'use strict';

    var underlying = document.getElementById('underlying').value;
    sessionStorage.setItem('underlying', underlying);

    Contract.getContracts(underlying);

    requestTradeAnalysis();
}

/*
 * Function to display contract form for current underlying
 */
function processContract(contracts) {
    'use strict';

    Contract.setContracts(contracts);

    var formname = sessionStorage.getItem('formname') || 'risefall';

    // set form to session storage
    sessionStorage.setItem('formname', formname);

    displayContractForms('contract_form_name_nav', getAllowedContractCategory(Contract.contractForms()), formname);

    processContractForm();
}

function processContractForm() {
    Contract.details(sessionStorage.getItem('formname'));

    // forget the old tick id i.e. close the old tick stream
    processForgetTickId();
    // get ticks for current underlying
    TradeSocket.send({ ticks : sessionStorage.getItem('underlying') });

    displayDurations('spot');

    displayStartDates();

    processPriceRequest();
}

/*
 * Function to request for cancelling the current price proposal
 */
function processForgetPriceIds() {
    'use strict';
    if (Price) {
        var priceIds = Price.bufferedIds();
        for (var id in priceIds) {
            if (priceIds.hasOwnProperty(id)) {
                TradeSocket.send({ forget: id });
                delete priceIds[id];
            }
        }
        Price.clearMapping();
    }
}

/*
 * Function to process and calculate price based on current form
 * parameters or change in form parameters
 */
function processPriceRequest() {
    'use strict';

    showPriceLoadingIcon();
    processForgetPriceIds();
    for (var typeOfContract in Contract.contractType()[Contract.form()]) {
        if(Contract.contractType()[Contract.form()].hasOwnProperty(typeOfContract)) {
            TradeSocket.send(Price.proposal(typeOfContract));
        }
    }
}

/*
 * Function to cancel the current tick stream
 * this need to be invoked before makin
 */
function processForgetTickId() {
    'use strict';
    if (Tick) {
        var tickIds = Tick.bufferedIds();
        for (var id in tickIds) {
            if (tickIds.hasOwnProperty(id)) {
                TradeSocket.send({ forget: id });
                delete tickIds[id];
            }
        }
    }
}

/*
 * Function to process ticks stream
 */
function processTick(tick) {
    'use strict';
    Tick.details(tick);
    Tick.display();
    if (!Barriers.isBarrierUpdated()) {
        Barriers.display();
        Barriers.setBarrierUpdate(true);
    }
}
