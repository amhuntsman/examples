/**
 * AMH.Calendar.js
 * Calendar administration JQuery library
 *
 * Author: Aaron Huntsman <aaron.huntsman@gmail.com>
 * Date: 2011-11-09
 */
var AMH = AMH || {};

AMH.Admin = {};

AMH.Admin.EventList = function (l, cal) {
    this.init(l, cal);
};
AMH.Admin.EventList.prototype = {
    init: function (l, cal) {
        this.docURL = document.URL;
        this.eventListNode = $(l);
        this.calendar = cal;
        // Update events list whenever calendar is initialized or the month/year changes
        (function (l) {
            $(window).on('AMH.Calendar.update', function (v, firstDate, lastDate) {
                l.updateEventList(firstDate, lastDate);
            });
            $(window).on('AMH.Calendar.eventsUpdate', function (v) {
                l.loadEvents();
                l.calendar.displayCalendar();
            });
            l.eventListNode.find('a.newEvent').click(function (v) {
                v.preventDefault();
                l.eventSelect("new");
            });
            l.bindEventLinks();
        })(this);
    },
    bindEventLinks: function () {
        (function (l) {
            l.eventListNode.find('li.eventItem a').click(function (v) {
                v.preventDefault();
                l.eventSelect($(this));
            });
        })(this);
    },
    loadEvents: function () {
        (function (l) {
            $.ajax(l.docURL + "?json=1", {
                cache: false,
                success: function (d, s, x) {
                    var ul = l.eventListNode.find('ul').first();
                    ul.empty();
                    for (var e in d.events) {
                        ul.append('<li class="eventItem" data-start-date="' +
                            d.events[e].startDate + '" data-end-date="' + d.events[e].endDate +
                            '"><a data-event-id="' + d.events[e].id + '" href="' +
                            l.docURL + '?id=' + d.events[e].id + '">' + d.events[e].name + '</a></li>');
                    }
                    l.bindEventLinks();
                }
            });
        })(this);
    },
    updateEventList: function (firstDate, lastDate) {
        l = this.eventListNode;
        l.find('li.eventItem').each(function (i, li) {
            var s = $(li).data('startDate'), e = $(li).data('endDate');
            if ((s >= firstDate && s <= lastDate) || (e >= firstDate && e <= lastDate)) {
                $(li).show();
            } else {
                $(li).hide();
            }
        });
    },
    eventSelect: function (l) {
        var n = this.eventListNode;
        if (l == "new") {
            n.trigger("AMH.Calendar.eventLoad", ["new", {}]);
        } else {
            var eid = l.data('eventId');
            (function (t) {
                $.ajax(t.docURL, {
                    cache: false,
                    data: { json: 1, id: eid },
                    error: function (x, s, e) {
                        alert(s);
                    },
                    success: function (d, s, x) {
                        // trigger event load
                        t.eventID = d.data.id;
                        n.trigger("AMH.Calendar.eventLoad", [t.eventID, d.data]);
                    }
                });
            })(this);
        }
    }
};

AMH.Admin.EventForm = function (l, list) {
    this.init(l, list);
}
AMH.Admin.EventForm.prototype = {
    init: function (l, list) {
        this.eventFormNode = $(l);
        this.eventList = list;
        this.eventID = "";
        this.eventSeriesList = new AMH.Admin.EventSeries.List(this.eventFormNode.find('div.eventSeriesList').first());
        (function (f) {
            $(window).on("AMH.Calendar.eventLoad", function (v, eventID, eventData) {
                f.populateForm(eventID, eventData);
                f.eventList.eventListNode.hide();
                f.eventList.calendar.setDates(eventData.startDate, eventData.endDate);
                f.eventFormNode.show();
            });
            $(window).on("AMH.Calendar.dateSelect", function (v, startDate, endDate) {
                var n = f.eventFormNode;
                n.find('input[name="txtStartDate"]').val(startDate);
                n.find('input[name="txtEndDate"]').val(endDate);
            });
            f.eventFormNode.find('form').submit(function (v) {
                v.preventDefault();
                f.submit();
            });
            f.eventFormNode.find('div.formClose a').click(function (v) {
                v.preventDefault();
                f.close();
            });
            f.eventFormNode.find('div.formDelete a').click(function (v) {
                v.preventDefault();
                f.deleteEvent();
            });
        })(this);
    },
    populateForm: function (eventID, eventData) {
        var n = this.eventFormNode;
        this.eventID = eventID;
        if (eventID == "new") {
            n.find('div.formDelete').hide();
        } else {
            n.find('div.formDelete').show();
        }
        n.find('input[name="txtStartDate"]').val(eventData.startDate);
        n.find('input[name="txtEndDate"]').val(eventData.endDate);
        n.find('input[name="txtName"]').val(eventData.name);
        n.find('select[name="txtSeriesId"]').val(eventData.seriesID);
    },
    close: function () {
        $(this.eventFormNode.find('div.formStatus')).clearQueue().hide();
        this.eventFormNode.hide();
        this.eventList.eventListNode.show();
    },
    deleteEvent: function () {
        if (window.confirm("Are you sure?")) {
            (function (f) {
                $.ajax(f.eventList.docURL + "?id=" + f.eventID + "&json=1&delete=1", {
                    cache: false,
                    type: "POST",
                    error: function (x, s, e) {
                        alert(x.responseText);
                    },
                    success: function (d, s, x) {
                        f.eventFormNode.trigger("AMH.Calendar.eventsUpdate");
                        f.eventFormNode.trigger("AMH.Admin.EventSeries.update");
                        f.close();
                    }
                });
            })(this);
        }
    },
    submit: function () {
        var n = this.eventFormNode;
        var 
        startDate = n.find("input#txtStartDate").val(),
        endDate = n.find("input#txtEndDate").val(),
        name = n.find("input#txtName").val(),
        seriesID = n.find("select#txtSeriesId").val();
        var formData = { txtStartDate: startDate, txtEndDate: endDate, txtName: name, txtSeriesId: seriesID };

        (function (f) {
            $.ajax(f.eventList.docURL + "?id=" + f.eventID + "&json=1", {
                cache: false,
                type: "POST",
                data: formData,
                error: function (x, s, e) {
                    f.flashMessage($.parseJSON(x.responseText).error, "error");
                },
                success: function (d, s, x) {
                    f.eventID = d.id;
                    f.eventFormNode.find('div.formDelete').show();
                    f.flashMessage(d.status, "status");
                    f.eventFormNode.trigger("AMH.Calendar.eventsUpdate");
                    f.eventFormNode.trigger("AMH.Admin.EventSeries.updated", formData.seriesID);
                }
            });
        })(this);
    },
    flashMessage: function (msg, c) {
        var n = this.eventFormNode.find('div.formStatus');
        n.html('<span class="' + c + '">' + msg + '</span>').clearQueue().show().delay(3000).slideUp(500);
    }
}

AMH.Admin.EventSeries = {};
AMH.Admin.EventSeries.List = function (l) {
    this.init(l);
};
AMH.Admin.EventSeries.List.prototype = {
    init: function (l) {
        this.eventSeriesListNode = $(l);
        this.fetchEventSeries();
        (function (list) {
            var n = list.eventSeriesListNode;
            n.find("span.add").click(function (v) {
                list.openSeriesForm();
            });
            n.find("span.edit").click(function (v) {
                var id = $(this).siblings("select").find("option").filter(":selected").val();
                list.openSeriesForm(id);
            });
            n.find("span.delete").click(function (v) {
                var id = $(this).siblings("select").find("option").filter(":selected").val();
                list.deleteSeries(id);
            });
            $(window).on('AMH.Admin.EventSeries.updated', function (v, id) {
                list.fetchEventSeries(id);
            });
        })(this);
    },
    fetchEventSeries: function (id) {
        (function (n) {
            $.ajax('/admin/CalendarEventSeries.aspx', {
                cache: false,
                data: { json: 1 },
                success: function (d, s, x) {
                    var sel = n.find('select').first().empty();
                    for (var i in d.series) {
                        var series = d.series[i];
                        sel.append($("<option>").val(series.id).data("deletable", (series.eventCount > 0 ? false : true)).append(series.name));
                    }
                    if (id) { sel.val(id); }
                    n.find("select").change(function (v) {
                        if ($(this).find('option').filter(':selected').data('deletable')) {
                            n.find("span.delete").show();
                        } else {
                            n.find("span.delete").hide();
                        }
                    }).change();
                }
            });
        })(this.eventSeriesListNode);
    },
    openSeriesForm: function (id) {
        new AMH.Admin.EventSeries.Form(id);
    },
    deleteSeries: function (id) {
        (function (l) {
            if (confirm("Are you sure?")) {
                $.ajax('/admin/CalendarEventSeries.aspx?json=1&delete=1&id=' + id.toString(), {
                    cache: false,
                    type: "POST",
                    success: function (d, s, x) {
                        l.eventSeriesListNode.trigger('AMH.Admin.EventSeries.updated');
                    },
                    error: function (x, s, e) { alert(s); }
                });
            }
        })(this);
    }
};
AMH.Admin.EventSeries.Form = function (id) {
    this.init(id);
};
AMH.Admin.EventSeries.Form.prototype = {
    init: function (seriesID) {
        this.seriesID = seriesID;
        (function (f) {
            $.ajax('/admin/CalendarEventSeries.aspx', {
                data: { ajaxSeriesForm: 1, id: seriesID },
                success: function (d, s, x) {
                    f.formNode = $(d);
                    f.setupForm();
                }
            });
        })(this);
    },
    setupForm: function () {
        (function (f) {
            var n = f.formNode;
            n.find('input[type="submit"]').val(f.seriesID ? "Update" : "Create");
            n.find('select#txtMarkerColor').change(function (v) {
                var color = $(this).find('option').filter(':selected').val();
                $(this).siblings('span.testMarker').css('background-color', '#' + color);
            }).change();
            n.submit(function (v) {
                v.preventDefault();
                f.submit();
            });
            n.dialog({
                title: f.seriesID ? "Edit Series" : "New Series",
                modal: true
            });
        })(this);
    },
    submit: function () {
        var formData = {
            txtSeriesName: this.formNode.find("input#txtSeriesName").val(),
            txtMarkerColor: this.formNode.find("select#txtMarkerColor").val()
        };
        (function (f) {
            var id = f.seriesID ? f.seriesID.toString() : ""
            $.ajax('/admin/CalendarEventSeries.aspx?json=1&id=' + id, {
                cache: false,
                type: "POST",
                data: formData,
                error: function (x, s, e) {
                    var d = $.parseJSON(x.responseText);
                    f.flashError(d.error, d.error_fields);
                },
                success: function (d, s, x) {
                    f.formNode.trigger('AMH.Admin.EventSeries.updated', d.id);
                    f.formNode.dialog('close');
                }
            });
        })(this);
    },
    flashError: function (msg, fields) {
        var n = this.formNode.find('div.errorMessage');
        n.html(msg).clearQueue().show().delay(3000).slideUp(500);
    }
};

AMH.Calendar = function (l) {
    this.init(l);
};
AMH.Calendar.displayCalendar = function (cal) {
    $.ajax('/Ajax/AdminCalendar.aspx', {
        cache: false,
        data: { month: cal.displayMonth + 1, year: cal.displayYear },
        success: function (d, s, x) {
            cal.calendarNode.html(d);
            cal.calendarNode.find('td').click(function (v) {
                var shift = v.shiftKey;
                if (shift) {
                    cal.selectDateShift($(this));
                } else {
                    cal.selectDate($(this));
                };
            });
            cal.calendarNode.find('th.prevMonth a').click(function (v) { v.preventDefault(); cal.prevMonth(); });
            cal.calendarNode.find('th.prevYear a').click(function (v) { v.preventDefault(); cal.prevYear(); });
            cal.calendarNode.find('th.nextMonth a').click(function (v) { v.preventDefault(); cal.nextMonth(); });
            cal.calendarNode.find('th.nextYear a').click(function (v) { v.preventDefault(); cal.nextYear(); });
            cal.drawSelectedDates();
            cal.calendarNode.trigger('AMH.Calendar.update', cal.displayDateRange());
        }
    });
};
AMH.Calendar.prototype = {
    displayCalendar: function () {
        AMH.Calendar.displayCalendar(this);
    },

    init: function (l) {
        this.calendarNode = $(l);
        this.setDefaultDate();
        this.displayCalendar();
    },

    setDefaultDate: function () {
        this.focusDate = new Date();
        this.displayMonth = this.focusDate.getMonth();
        this.displayYear = this.focusDate.getFullYear();
        this.anchorDate = this.stretchDate = "";
    },

    selectDate: function (td) {
        this.anchorDate = this.stretchDate = td.data('date');
        td.parents('table').find('td').removeClass('selected');
        td.addClass('selected');
        this.calendarNode.trigger('AMH.Calendar.dateSelect', [this.startDate(), this.endDate()]);
    },

    selectDateShift: function (td) {
        if (this.anchorDate === "") {
            this.selectDate(td);
        } else {
            this.stretchDate = td.data('date');
            this.drawSelectedDates();
        }
        this.calendarNode.trigger('AMH.Calendar.dateSelect', [this.startDate(), this.endDate()]);
    },

    startDate: function () {
        if (this.anchorDate < this.stretchDate) {
            return this.anchorDate;
        } else {
            return this.stretchDate;
        }
    },
    endDate: function () {
        if (this.stretchDate < this.anchorDate) {
            return this.anchorDate;
        } else {
            return this.stretchDate;
        }
    },
    prevMonth: function () {
        this.displayMonth--;
        if (this.displayMonth < 0) {
            this.displayMonth += 12;
            this.displayYear--;
        }
        this.displayCalendar();
    },
    nextMonth: function () {
        this.displayMonth++;
        if (this.displayMonth > 11) {
            this.displayMonth -= 12;
            this.displayYear++;
        }
        this.displayCalendar();
    },
    prevYear: function () {
        this.displayYear--;
        this.displayCalendar();
    },
    nextYear: function () {
        this.displayYear++;
        this.displayCalendar();
    },
    displayDateRange: function () {
        return [this.calendarNode.find('tbody td').first().data("date"),
             this.calendarNode.find('tbody td').last().data("date")];
    },
    setDates: function (startDate, endDate) {
        this.anchorDate = startDate;
        this.stretchDate = endDate;
        this.drawSelectedDates();
    },
    drawSelectedDates: function () {
        (function (cal) {
            cal.calendarNode.find('tbody td').each(function (i, tds) {
                var tdj = $(tds);
                if (tdj.data('date') >= cal.startDate() && tdj.data('date') <= cal.endDate()) {
                    tdj.addClass('selected');
                } else {
                    tdj.removeClass('selected');
                }
            });
        })(this);
    }
}
