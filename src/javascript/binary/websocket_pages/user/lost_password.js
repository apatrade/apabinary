const BinaryPjax  = require('../../base/binary_pjax');
const localize    = require('../../base/localize').localize;
const FormManager = require('../../common_functions/form_manager');

const LostPassword = (function() {
    'use strict';

    const responseHandler = function(response) {
        if (response.verify_email) {
            BinaryPjax.load('user/reset_passwordws');
        } else if (response.error) {
            $('#form_error').removeClass('invisible').text(localize(response.error.message));
        }
    };

    const onLoad = function() {
        const form_id = '#frm_lost_password';
        FormManager.init(form_id, [
            { selector: '#email', validations: ['req', 'email'], request_field: 'verify_email' },
            { request_field: 'type', value: 'reset_password' },
        ]);
        FormManager.handleSubmit(form_id, {}, responseHandler);
    };

    return {
        onLoad: onLoad,
    };
})();

module.exports = LostPassword;
