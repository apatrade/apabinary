const BinaryPjax           = require('../../base/binary_pjax');
const Client               = require('../../base/client').Client;
const Header               = require('../../base/header').Header;
const default_redirect_url = require('../../base/url').default_redirect_url;
const japanese_client      = require('../../common_functions/country_base').japanese_client;
const japanese_residence   = require('../../common_functions/country_base').japanese_residence;

const Cashier = (function() {
    'use strict';

    const lock = function(lock_type) {
        $.each($('.' + lock_type), function() {
            disableButton($(this).parent());
        });
    };

    const checkLocked = function() {
        if (!Client.is_logged_in()) return;
        BinarySocket.wait('authorize', 'website_status').then(() => {
            if (japanese_client() && !japanese_residence()) {
                BinaryPjax(default_redirect_url());
                return;
            }
            checkTopUpWithdraw();
            if (Client.get('is_virtual')) return;
            BinarySocket.wait('get_account_status').then(() => {
                if (Client.status_detected('cashier_locked')) {
                    lock('deposit, .withdraw');
                } else if (Client.status_detected('withdrawal_locked')) {
                    lock('withdraw');
                } else if (Client.status_detected('unwelcome')) {
                    lock('deposit');
                }
                Client.activate_by_client_type();
            });
        });
    };

    const checkTopUpWithdraw = function() {
        BinarySocket.wait('balance').then(() => {
            const currency = Client.get('currency');
            const balance = Client.get('balance');
            if (Client.get('is_virtual')) {
                if ((currency !== 'JPY' && balance > 1000) ||
                    (currency === 'JPY' && balance > 100000)) {
                    disableButton('#VRT_topup_link');
                }
                Client.activate_by_client_type();
            } else if (!currency || +balance === 0) {
                lock('withdraw');
            }
        });
    };

    const disableButton = function(el_to_replace) {
        const $a = $(el_to_replace);
        if ($a.length === 0) return;

        // use replaceWith, to disable previously caught pjax event
        const new_element = { class: $a.attr('class').replace('toggle', 'button-disabled'), html: $a.html() };

        const id = $a.attr('id');
        if (id) {
            new_element.id = id;
        }

        $a.replaceWith($('<a/>', new_element));
    };

    const onLoad = function() {
        if (Client.is_logged_in()) {
            checkLocked();
            Header.upgrade_message_visibility(); // To handle the upgrade buttons visibility
            if (Client.get('is_virtual') || /CR/.test(Client.get('loginid'))) {
                $('#payment-agent-section').removeClass('invisible');
            }
            if (Client.has_gaming_financial_enabled()) {
                $('#account-transfer-section').removeClass('invisible');
            }
        }
    };

    return {
        checkLocked   : checkLocked,
        onLoad        : onLoad,
        PaymentMethods: { onLoad: () => { checkLocked(); } },
    };
})();

module.exports = Cashier;
