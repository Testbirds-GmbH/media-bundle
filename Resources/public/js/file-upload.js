/**
 * Initialization of file upload widget
 *
 * @author Nikolay Georgiev
 * @refactor Diego Yungh
 * @version 1.0.1
 */
;(function($, plupload, window, document, undefined) {
    'use strict';
    // Set no conflict with other libraries
    $.noConflict();
    // 
    var pluginName = "thraceFileUpload",
        defaults = {};
    // Searching for file upload elements
    var Plugin;
    // Basic plugin pattern
    Plugin = function(element, options) {
        this.element = element;
        this.$element = $(element);
        //
        this.options = $.extend({}, defaults, this.options, this.$element.data('options'));
        this._defaults = defaults;
        this._name = pluginName;
        //
        this.init();
    };

    Plugin.prototype = {
        init: function() {
            // Buttons
            this.registerButtons();
            // Sections
            this.registerElements();
            // Events
            this.setupEvents();
            // check for empty input
            this.checkEmpty();
            // Init uploader
            this.setupUploader();
            // Uploader Callbacks
            this.setupUploaderCallbacks();
            // Uploader Events
            this.setupUploaderEvents();
            // Init uploader
            this.uploader.init();
            // Appear
            this.$element.fadeIn(1000);
        },

        setupUploaderEvents: function(){
            // Removes file from upload queue
            this.$element.find('#thrace-upload-remove-file-' + this.options.id).find('a').click($.proxy(function() {
                this.uploader.removeFile(
                    this.uploader.getFile(this.fileUpload.attr('id'))
                );
                //
                this.progressbar.fadeOut().next().fadeOut($.proxy(function() {
                    this.$element.find('#thrace-upload-file-' + this.options.id).fadeIn();
                    $('body').trigger('refreshPlUpload');
                }, this));
                //
                return false;
            }, this));
            // Remove button click event
            this.$element.find('#thrace-file-btn-remove-' + this.options.id).click($.proxy(function() {
                this.$element.find('#' + this.options.scheduled_for_deletion_id).val(true);
                this.$element.find('#' + this.options.original_name_id).val('');
                this.$element.find('#' + this.options.hash_id).val('');

                this.$element.find('#thrace-file-name-' + this.options.id).hide();
                this.$element.find('#thrace-file-size-' + this.options.id).hide();
                this.$element.find('#thrace-file-empty-' + this.options.id).fadeIn(function() {
                    $('body').trigger('refreshPlUpload');
                });
                this.resetMeta();
                this.disableButtons();

                return false;
            }, this));
            // Configuring dialog file meta information
            this.$element.find("#thrace-dlg-meta-edit-" + this.options.id).dialog({
                'autoOpen': false,
                'modal': true,
                'width': 'auto',
                close: $.proxy(function(event, ui) {
                    this.$element.find('#' + this.options.title_id).val(
                        this.$element.find('#thrace-meta-title-' + this.options.id).val());
                    this.$element.find('#' + this.options.caption_id).val(
                        this.$element.find('#thrace-meta-caption-' + this.options.id).val());
                    this.$element.find('#' + this.options.description_id).val(
                        this.$element.find('#thrace-meta-description-' + this.options.id).val());
                    this.$element.find('#' + this.options.author_id).val(
                        this.$element.find('#thrace-meta-author-' + this.options.id).val());
                    this.$element.find('#' + this.options.copywrite_id).val(
                        this.$element.find('#thrace-meta-copywrite-' + this.options.id).val());
                }, this)
            });
            // Opens dialog file edit meta
            this.$element.find('#thrace-meta-btn-edit-' + this.options.id).click($.proxy(function() {
                this.$element.find('#thrace-dlg-meta-edit-' + this.options.id).dialog('open');
            }, this));
            // Saves changes of file meta information and closes dialog
            this.$element.find('#thrace-edit-dlg-done-btn-' + this.options.id).button({
                icons: {
                    primary: "ui-icon ui-icon-check"
                }
            }).click($.proxy(function() {
                this.$element.find('#thrace-dlg-meta-edit-' + this.options.id).dialog('close');
            }, this));
        },

        setupUploaderCallbacks: function(){
            //  Uploader Event: Refresh
            $('body').bind('refreshPlUpload', $.proxy(function() {
                this.uploader.refresh();
            }, this));
            //  Uploader Event: FilesAdded 
            this.uploader.bind('FilesAdded', $.proxy(function(up, files) {
                var html;
                setTimeout(function() {
                    up.start();
                }, 100);
                //
                $('#thrace-upload-remove-file-' + this.options.id).find('a').attr('id', files[0].id);
                //
                html = files[0].name.substring(0, 50) + ' (' + plupload.formatSize(files[0].size) + ')';
                //
                this.fileInfoSection.html(html);
            }, this));
            // Uploader Event: UploadFile
            this.uploader.bind('UploadFile', $.proxy(function(up) {
                this.uploadButton.button("option", "disabled", true);
                this.disableButtons();
                this.$element.find('#thrace-upload-file-' + this.options.id).hide();
                this.progressbar.fadeIn().next().fadeIn(function() {
                    $('body').trigger('refreshPlUpload');
                });

            }, this));
            // Uploader Event: UploadProgress
            this.uploader.bind('UploadProgress', $.proxy(function(up, file) {
                this.progressbar.progressbar("option", "value", file.percent);
                this.progressbar.next().find('strong').html(file.percent + '%');
            }, this));
            // Uploader Event: FileUploaded
            this.uploader.bind("FileUploaded", $.proxy(function(up, file, response) {
                this.progressbar.fadeOut();
                // response from server
                var data = $.parseJSON(response.response);
                //
                if (data.success === false) {
                    this.showError(data.err_msg);
                    if ($('#' + this.options.name_id).val() == '') {
                        this.disableButtons();
                    }
                } else if (data.success === true) {
                    this.$element.find('#' + this.options.name_id).val(data.name);
                    this.$element.find('#' + this.options.original_name_id).val(file.name);
                    this.$element.find('#' + this.options.hash_id).val(data.hash);
                    this.$element.find('#' + this.options.scheduled_for_deletion_id).val(0);
                    //
                    $('#thrace-file-empty-' + this.options.id).hide();
                    //
                    $('#thrace-file-name-' + this.options.id).fadeIn()
                        .find('.thrace-file-name').text(file.name.substring(0, 50))
                        .fadeIn($.proxy(function() {
                            $('body').trigger('refreshPlUpload');
                            this.uploadButton.button("option", "disabled", false);
                            this.enableButtons();
                        }, this));
                    //
                    $('#thrace-upload-file-' + this.options.id).fadeIn();
                }
                //
                this.progressbar.next().fadeOut(function() {
                    $('body').trigger('refreshPlUpload');
                });
            }, this));
        },

        setupUploader: function(){
            this.uploader = new plupload.Uploader({
                runtimes: this.options.runtimes,
                multi_selection: false,
                multiple_queues: false,
                dragdrop: true,
                drop_element: 'thrace-file-' + this.options.id,
                max_file_count: 1,
                browse_button: 'thrace-file-btn-upload-' + this.options.id,
                multipart: true,
                multipart_params: {
                    thrace_media_id: this.options.id
                },
                url: this.options.upload_url,
                flash_swf_url: this.options.plupload_flash_path_swf
            });
        },

        checkEmpty: function(){
            // Checking if value is empty
            if (this.$element.find('#' + this.options.name_id).val() === '') {
                this.disableButtons();

            } else {
                this.populateMeta();
            }
        },

        registerButtons: function() {
            // Create Upload button
            this.$element.find('.thrace-file-upload-button').button();
            // Register
            this.uploadButton = this.$element.find('#thrace-file-btn-upload-' + this.options.id);
            this.enableButton = this.$element.find('#thrace-file-btn-enabled-' + this.options.id);
            this.removeButton = this.$element.find('#thrace-file-btn-remove-' + this.options.id);
            this.editButton = this.$element.find('#thrace-meta-btn-edit-' + this.options.id);
        },

        registerElements: function() {
            // Error
            this.errorSection = this.$element.find('#thrace-file-error-' + this.options.id);
            // Info
            this.fileInfoSection = this.$element.find('#thrace-file-info-' + this.options.id);
            // Progress
            this.progressbar = this.$element.find('#thrace-progressbar-' + this.options.id).progressbar();
            //
            this.fileUpload = this.$element.find('.thrace-file-upload');
        },

        disableButtons: function() {
            this.enableButton.button("option", {
                "disabled": true
            });
            this.removeButton.button("option", "disabled", true);
            this.editButton.button("option", "disabled", true);
        },

        enableButtons: function() {
            this.enableButton.button("option", {
                "disabled": false
            });
            this.removeButton.button("option", "disabled", false);
            this.editButton.button("option", "disabled", false);
        },

        showError: function(err_msg) {
            this.errorSection
                .fadeIn(function() {
                    $('body').trigger('refreshPlUpload');
                })
                .find('.thrace-fileupload-error')
                .html(err_msg);
            this.uploadButton.button("option", "disabled", true);
            this.disableButtons();
        },

        hasError: function() {
            return this.errorSection.is(':visible');
        },

        toggleActive: function() {
            var element = this.$element.find('#' + this.options.enabled_id);
            if (this.enableButton.hasClass('ui-icon-bullet')) {
                this.enableButton.removeClass('ui-icon-bullet').addClass('ui-icon-radio-on');
                element.val(0);
            } else {
                this.enableButton.removeClass('ui-icon-radio-on').addClass('ui-icon-bullet');
                element.val(1);
            }
        },

        setupEvents: function() {
            // disable click
            this.uploadButton.click(function() {
                return false;
            });
            //
            this.enableButton.click($.proxy(function(event) {
                this.toggleActive();
            }, this));
            //
            this.$element.find('#thrace-upload-error-cancel-' + this.options.id).click($.proxy(function() {
                this.errorSection
                    .fadeOut(function() {
                        // NOTE: is this really necessary in the main scope?
                        $('body').trigger('refreshPlUpload');
                    });
                //
                this.uploadButton.button("option", "disabled", false);
                //
                if (this.$element.find('#' + this.options.name_id).val() != '') {
                    this.enableButtons();
                }
                //
                $('#thrace-upload-file-' + this.options.id).fadeIn(function() {
                    $('body').trigger('refreshPlUpload');
                });
                //
                return false;
            }, this));
        },
        // Populate meta data
        populateMeta: function() {
            this.$element.find('#thrace-meta-title-' + this.options.id).val(this.$element.find('#' + this.options.title_id).val());
            this.$element.find('#thrace-meta-caption-' + this.options.id).val(this.$element.find('#' + this.options.caption_id).val());
            this.$element.find('#thrace-meta-description-' + this.options.id).val(this.$element.find('#' + this.options.description_id).val());
            this.$element.find('#thrace-meta-author-' + this.options.id).val(this.$element.find('#' + this.options.author_id).val());
            this.$element.find('#thrace-meta-copywrite-' + this.options.id).val(this.$element.find('#' + this.options.copywrite_id).val());
        },
        //  Reset meta data
        resetMeta: function() {
            this.$element.find('#' + this.options.title_id).val('');
            this.$element.find('#thrace-meta-title-' + this.options.id).val('');
            this.$element.find('#' + this.options.caption_id).val('');
            this.$element.find('#thrace-meta-caption-' + this.options.id).val('');
            this.$element.find('#' + this.options.description_id).val('');
            this.$element.find('#thrace-meta-description-' + this.options.id).val('');
            this.$element.find('#' + this.options.author_id).val('');
            this.$element.find('#thrace-meta-author-' + this.options.id).val('');
            this.$element.find('#' + this.options.copywrite_id).val('');
            this.$element.find('#thrace-meta-copywrite-' + this.options.id).val('');
        }
    };

    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                    new Plugin(this, this.options));
            }
        });
    };

    $('.thrace-file-upload-main').thraceFileUpload();

})(jQuery, plupload, window, document);