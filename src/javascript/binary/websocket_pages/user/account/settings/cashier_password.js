const BinaryPjax  = require('../../../../base/binary_pjax');
const localize    = require('../../../../base/localize').localize;
const Content     = require('../../../../common_functions/content').Content;
const FormManager = require('../../../../common_functions/form_manager');

const CashierPassword = (function() {
    'use strict';

    let $form,
        redirect_url;
    const form_id = '#frm_cashier_password';
    const hidden_class = 'invisible';

    const onLoad = function() {
        Content.populate();
        $form = $(form_id);

        BinarySocket.wait('authorize').then(() => {
            BinarySocket.send({ cashier_password: 1 }).then(response => init(response));
        });
    };

    const updatePage = function(config) {
        $('legend').text(localize(config.legend));
        $('#lockInfo').text(localize(config.info));
        $form.find('button').html(localize(config.button));
    };

    const init = function(response) {
        const locked = response.cashier_password;
        if (locked) {
            updatePage({
                legend: 'Unlock Cashier',
                info  : 'Your cashier is locked as per your request - to unlock it, please enter the password.',
                button: 'Unlock Cashier',
            });
            $('#repeat_password_row').addClass(hidden_class);
        } else {
            updatePage({
                legend: 'Lock Cashier',
                info  : 'An additional password can be used to restrict access to the cashier.',
                button: 'Update',
            });
            $('#repeat_password_row').removeClass(hidden_class);
        }
        $form.removeClass(hidden_class);
        FormManager.init(form_id, [
            { selector: '#cashier_password',        validations: ['req', locked ? ['length', { min: 6, max: 25 }] : 'password'], request_field: locked ? 'unlock_password' : 'lock_password' },
            { selector: '#repeat_cashier_password', validations: ['req', ['compare', { to: '#cashier_password' }]], exclude_request: 1 },
        ]);
        FormManager.handleSubmit(form_id, { cashier_password: 1 }, handleResponse);
    };

    const handleResponse = function(response) {
        const $form_error = $('#form_error');
        const $form_message = $('#form_message');
        $form_message.text('');
        $form_error.text('');
        if (response.error) {
            let message = response.error.message;
            if (response.error.code === 'InputValidationFailed') {
                message = 'Sorry, you have entered an incorrect cashier password';
            }
            $form_error.text(localize(message));
            return;
        }
        redirect_url = sessionStorage.getItem('cashier_lock_redirect') || '';
        $form.addClass(hidden_class);
        $form_message.text(localize('Your settings have been updated successfully.'));
        setTimeout(redirect, 2000);
    };

    const redirect = function() {
        if (redirect_url) {
            sessionStorage.removeItem('cashier_lock_redirect');
            BinaryPjax.load(redirect_url);
        }
    };

    return {
        onLoad: onLoad,
    };
})();

module.exports = CashierPassword;
