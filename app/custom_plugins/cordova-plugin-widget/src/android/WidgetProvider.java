package com.dailylist.vadimsemenyk.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.net.Uri;
import android.os.Bundle;
import android.widget.RemoteViews;

import com.dailylist.vadimsemenyk.R;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class WidgetProvider extends AppWidgetProvider {
    final static String ACTION_LIST_ITEM_LICK = "com.dailylist.vadimsemenyk.widget.list_item_click";
    final static String ACTION_OPEN_ADD = "com.dailylist.vadimsemenyk.widget.open_add";
    final static String ACTION_OPEN_APP = "com.dailylist.vadimsemenyk.widget.open_app";
    final static String ACTION_LIST_WITH_TIME = "cosetNoteFinishStatem.dailylist.vadimsemenyk.widget.set_list_with_time";
    final static String ACTION_LIST_WITHOUT_TIME = "com.dailylist.vadimsemenyk.widget.set_list_without_time";
    final static String ACTION_UPDATE = "com.dailylist.vadimsemenyk.widget.update";
    final static String ACTION_UPDATE_RESCHEDULE = "com.dailylist.vadimsemenyk.widget.update_reschedule";

    final static String WIDGET_SP = "com.dailylist.vadimsemenyk.widget";
    final static String WIDGET_SP_LIST_TYPE = "list_type";

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);

        scheduleUpdateEvent(context);
    }

    private void scheduleUpdateEvent(Context context) {
        Calendar dateTime = Calendar.getInstance();
        dateTime.set(Calendar.HOUR_OF_DAY, 0);
        dateTime.set(Calendar.MINUTE, 0);
        dateTime.set(Calendar.SECOND, 0);
        dateTime.set(Calendar.MILLISECOND, 0);
        dateTime.add(Calendar.MILLISECOND, 86400000);

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        alarmManager.setExact(AlarmManager.RTC, dateTime.getTimeInMillis(), getWidgetUpdateReschedulePIntent(context));
    }

    private void unScheduleUpdateEvent(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        alarmManager.cancel(getWidgetUpdateReschedulePIntent(context));
    }

    private PendingIntent getWidgetUpdateReschedulePIntent(Context context) {
        Intent intent = new Intent(context, WidgetProvider.class);
        intent.setAction(ACTION_UPDATE_RESCHEDULE);
        PendingIntent pIntent = PendingIntent.getBroadcast(context, 0, intent, 0);
        return pIntent;
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        super.onUpdate(context, appWidgetManager, appWidgetIds);

        for (int id : appWidgetIds) {
            updateWidget(context, appWidgetManager, id);
        }
    }

    private void updateWidget(Context context, AppWidgetManager appWidgetManager, int id) {
        DBHelper.createInstance(context.getApplicationContext());

        RemoteViews widgetView = new RemoteViews(context.getPackageName(), R.layout.widget);

        widgetView.setTextViewText(R.id.date, SimpleDateFormat.getDateInstance().format(Calendar.getInstance().getTime()));

        widgetView.setTextViewText(R.id.empty, getLocalizedResources(context, new Locale(NoteRepository.getInstance().getLocale())).getString(R.string.widget_list_empty));

        setList(widgetView, context, id);

        setListClick(widgetView, context, id);

        Intent openAddIntent = new Intent(context, WidgetProvider.class);
        openAddIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        openAddIntent.setAction(ACTION_OPEN_ADD);
        PendingIntent pIntent = PendingIntent.getBroadcast(context, id, openAddIntent, 0);
        widgetView.setOnClickPendingIntent(R.id.add, pIntent);

        Intent setListWithTimeIntent = new Intent(context, WidgetProvider.class);
        setListWithTimeIntent.setAction(ACTION_LIST_WITH_TIME);
        setListWithTimeIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        PendingIntent setListWithTimePIntent = PendingIntent.getBroadcast(context, id, setListWithTimeIntent, 0);
        widgetView.setOnClickPendingIntent(R.id.show_notes_with_time, setListWithTimePIntent);

        Intent setListWithoutTimeIntent = new Intent(context, WidgetProvider.class);
        setListWithoutTimeIntent.setAction(ACTION_LIST_WITHOUT_TIME);
        setListWithoutTimeIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        PendingIntent setListWithoutTimePIntent = PendingIntent.getBroadcast(context, id, setListWithoutTimeIntent, 0);
        widgetView.setOnClickPendingIntent(R.id.show_notes_without_time, setListWithoutTimePIntent);

        Intent openAppIntent = new Intent(context, WidgetProvider.class);
        openAppIntent.setAction(ACTION_OPEN_APP);
        openAppIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        PendingIntent openAppPIntent = PendingIntent.getBroadcast(context, id, openAppIntent, 0);
        widgetView.setOnClickPendingIntent(R.id.app_icon, openAppPIntent);

        appWidgetManager.updateAppWidget(id, widgetView);
        appWidgetManager.notifyAppWidgetViewDataChanged(id, R.id.list);
    }

    private void setListClick(RemoteViews rv, Context context, int appWidgetId) {
        Intent listClickIntent = new Intent(context, WidgetProvider.class);
        listClickIntent.setAction(ACTION_LIST_ITEM_LICK);
        listClickIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        PendingIntent listClickPIntent = PendingIntent.getBroadcast(context, appWidgetId, listClickIntent, 0);
        rv.setPendingIntentTemplate(R.id.list, listClickPIntent);
    }

    private void setList(RemoteViews rv, Context context, int appWidgetId) {
        Intent adapter = new Intent(context, WidgetListService.class);
        adapter.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        Uri data = Uri.parse(adapter.toUri(Intent.URI_INTENT_SCHEME));
        adapter.setData(data);
        rv.setEmptyView(R.id.list, R.id.empty);
        rv.setRemoteAdapter(R.id.list, adapter);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        Bundle extras = intent.getExtras();

        if (intent.getAction().equalsIgnoreCase(ACTION_UPDATE)) {
            updateAllWidgets(context);
        } else if (intent.getAction().equalsIgnoreCase(ACTION_UPDATE_RESCHEDULE)) {
            updateAllWidgets(context);
            scheduleUpdateEvent(context);
        } else if (
                intent.getAction().equalsIgnoreCase(Intent.ACTION_TIMEZONE_CHANGED)
                || intent.getAction().equalsIgnoreCase(Intent.ACTION_BOOT_COMPLETED)
                || intent.getAction().equalsIgnoreCase(Intent.ACTION_LOCKED_BOOT_COMPLETED)
        ) {
            scheduleUpdateEvent(context);
        } else if (intent.getAction().equalsIgnoreCase(ACTION_LIST_ITEM_LICK)) {
            int widgetId = extras.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
            if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
                return;
            }

            SharedPreferences sp = context.getSharedPreferences(WidgetProvider.WIDGET_SP, Context.MODE_PRIVATE);
            int type = sp.getInt(WidgetProvider.WIDGET_SP_LIST_TYPE + "_" + widgetId,  1);

            int itemId = intent.getIntExtra("item_id", -1);
            if (itemId != -1) {
                String actionTarget = intent.getStringExtra("action_target");

                if (actionTarget.equals("item")) {
                    launchApp(context);

                    JSONObject params = new JSONObject();
                    try {
                        params.put("id", itemId);
                        params.put("type", type);
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                    Widget.fireEvent("noteClick", params, true);
                } else if (actionTarget.equals("finish")) {
                    DBHelper.createInstance(context.getApplicationContext());
                    NoteRepository.getInstance().triggerNoteFinishState(itemId);
                    updateWidget(context, AppWidgetManager.getInstance(context), widgetId);

                    Widget.fireEvent("noteStateChange", false);
                }
            }
        } else if (intent.getAction().equalsIgnoreCase(ACTION_OPEN_ADD)) {
            int widgetId = extras.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
            if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
                return;
            }

            SharedPreferences sp = context.getSharedPreferences(WidgetProvider.WIDGET_SP, Context.MODE_PRIVATE);
            int type = sp.getInt(WidgetProvider.WIDGET_SP_LIST_TYPE + "_" + widgetId,  1);

            JSONObject params = new JSONObject();
            try {
                params.put("type", type);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            launchApp(context);
            Widget.fireEvent("addClick", params, true);
        } else if (intent.getAction().equalsIgnoreCase(ACTION_LIST_WITH_TIME) || intent.getAction().equalsIgnoreCase(ACTION_LIST_WITHOUT_TIME)) {
            int widgetId = extras.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
            if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
                return;
            }

            NoteTypes nextListType = intent.getAction().equalsIgnoreCase(ACTION_LIST_WITH_TIME) ? NoteTypes.Diary : NoteTypes.Note;

            SharedPreferences sp = context.getSharedPreferences(WIDGET_SP, Context.MODE_PRIVATE);
            sp.edit().putInt(WIDGET_SP_LIST_TYPE + "_" + widgetId, nextListType.getValue()).commit();

            updateWidget(context, AppWidgetManager.getInstance(context), widgetId);
        } else if (intent.getAction().equalsIgnoreCase(ACTION_OPEN_APP)) {
            launchApp(context);
        }
    }

    private void updateAllWidgets(Context context) {
        ComponentName thisAppWidget = new ComponentName(context.getPackageName(), getClass().getName());
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int ids[] = appWidgetManager.getAppWidgetIds(thisAppWidget);
        for (int appWidgetID : ids) {
            updateWidget(context, appWidgetManager, appWidgetID);
        }
    }

    private void launchApp(Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage("com.dailylist.vadimsemenyk");
        if (launchIntent != null) {
            context.startActivity(launchIntent);
        }
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        super.onDeleted(context, appWidgetIds);

        SharedPreferences.Editor editor = context.getSharedPreferences(WIDGET_SP, Context.MODE_PRIVATE).edit();
        for (int widgetID : appWidgetIds) {
            editor.remove(WIDGET_SP_LIST_TYPE + "_" + widgetID);
        }
        editor.commit();
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);

        unScheduleUpdateEvent(context);
    }

    static Resources getLocalizedResources(Context context, Locale desiredLocale) {
        Configuration conf = context.getResources().getConfiguration();
        conf = new Configuration(conf);
        conf.setLocale(desiredLocale);
        Context localizedContext = context.createConfigurationContext(conf);
        return localizedContext.getResources();
    }
}