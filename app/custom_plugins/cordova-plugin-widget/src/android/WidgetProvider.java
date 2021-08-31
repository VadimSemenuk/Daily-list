package com.dailylist.vadimsemenyk.widget;

import android.app.Activity;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Pair;
import android.widget.RemoteViews;
import android.widget.Toast;

import com.dailylist.vadimsemenyk.R;

import org.apache.cordova.CordovaWebView;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;

public class WidgetProvider extends AppWidgetProvider {
    final String ACTION_ON_CLICK = "com.dailylist.vadimsemenyk.widget.list_item_click";
    final String ACTION_OPEN_ADD = "com.dailylist.vadimsemenyk.widget.open_add";
    final String ACTION_LIST_WITH_TIME = "com.dailylist.vadimsemenyk.widget.set_list_with_time";
    final String ACTION_LIST_WITHOUT_TIME = "com.dailylist.vadimsemenyk.widget.set_list_without_time";

    final static String WIDGET_SP = "com.dailylist.vadimsemenyk.widget";
    final static String WIDGET_SP_LIST_TYPE = "list_type";

    final static String ITEM_ID = "item_id";

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);

        DBHelper.createInstance(context.getApplicationContext());
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        super.onUpdate(context, appWidgetManager, appWidgetIds);

        for (int id : appWidgetIds) {
            updateWidget(context, appWidgetManager, id);
        }
    }

    void updateWidget(Context context, AppWidgetManager appWidgetManager, int id) {
        RemoteViews widgetView = new RemoteViews(context.getPackageName(), R.layout.widget);

        widgetView.setTextViewText(R.id.date, SimpleDateFormat.getDateInstance().format(Calendar.getInstance().getTime()));

        setList(widgetView, context, id);

        setListClick(widgetView, context, id);

        Intent openAddIntent = new Intent(context, WidgetProvider.class);
        openAddIntent.setAction(ACTION_OPEN_ADD);
        openAddIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
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

        appWidgetManager.updateAppWidget(id, widgetView);
        appWidgetManager.notifyAppWidgetViewDataChanged(id, R.id.list);
    }

    void setListClick(RemoteViews rv, Context context, int appWidgetId) {
        Intent listClickIntent = new Intent(context, WidgetProvider.class);
        listClickIntent.setAction(ACTION_ON_CLICK);
        listClickIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        PendingIntent listClickPIntent = PendingIntent.getBroadcast(context, appWidgetId, listClickIntent, 0);
        rv.setPendingIntentTemplate(R.id.list, listClickPIntent);
    }

    void setList(RemoteViews rv, Context context, int appWidgetId) {
        Intent adapter = new Intent(context, WidgetListService.class);
        adapter.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        Uri data = Uri.parse(adapter.toUri(Intent.URI_INTENT_SCHEME));
        adapter.setData(data);
        rv.setRemoteAdapter(R.id.list, adapter);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        int widgetId = AppWidgetManager.INVALID_APPWIDGET_ID;
        Bundle extras = intent.getExtras();
        if (extras != null) {
            widgetId = extras.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        }

        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            return;
        }

        if (intent.getAction().equalsIgnoreCase(ACTION_ON_CLICK)) {
            int itemId = intent.getIntExtra(ITEM_ID, -1);
            if (itemId != -1) {
                launchApp(context);

                JSONObject params = new JSONObject();
                try {
                    params.put("id", itemId);
                } catch (JSONException e) {
                    e.printStackTrace();
                }

                Widget.fireEvent("noteClick", params);
            }
        } else if (intent.getAction().equalsIgnoreCase(ACTION_OPEN_ADD)) {
            launchApp(context);
            Widget.fireEvent("addClick");
        } else if (intent.getAction().equalsIgnoreCase(ACTION_LIST_WITH_TIME) || intent.getAction().equalsIgnoreCase(ACTION_LIST_WITHOUT_TIME)) {
            NoteTypes nextListType = intent.getAction().equalsIgnoreCase(ACTION_LIST_WITH_TIME) ? NoteTypes.Diary : NoteTypes.Note;

            SharedPreferences sp = context.getSharedPreferences(WIDGET_SP, Context.MODE_PRIVATE);
            sp.edit().putInt(WIDGET_SP_LIST_TYPE + "_" + widgetId, nextListType.getValue()).commit();

            updateWidget(context, AppWidgetManager.getInstance(context), widgetId);
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
    }

}