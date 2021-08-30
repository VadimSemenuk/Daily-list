package com.dailylist.vadimsemenyk.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;
import android.widget.Toast;

import com.dailylist.vadimsemenyk.R;

public class WidgetProvider extends AppWidgetProvider {
    final String ACTION_ON_CLICK = "com.dailylist.vadimsemenyk.widget.list_item_click";
    final String ACTION_OPEN_ADD = "com.dailylist.vadimsemenyk.widget.open_add";
    final static String ITEM_POSITION = "item_position";

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);

        DBHelper.createInstance(context.getApplicationContext());
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        super.onUpdate(context, appWidgetManager, appWidgetIds);

        for (int id : appWidgetIds) {
            RemoteViews widgetView = new RemoteViews(context.getPackageName(), R.layout.widget);
            widgetView.setTextViewText(R.id.text, "Note title...");

            setList(widgetView, context, id);

            setListClick(widgetView, context, id);

            Intent countIntent = new Intent(context, WidgetProvider.class);
            countIntent.setAction(ACTION_OPEN_ADD);
            countIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
            PendingIntent pIntent = PendingIntent.getBroadcast(context, id, countIntent, 0);
            widgetView.setOnClickPendingIntent(R.id.add, pIntent);

            appWidgetManager.updateAppWidget(id, widgetView);
            appWidgetManager.notifyAppWidgetViewDataChanged(id, R.id.list);
        }
    }

    void setListClick(RemoteViews rv, Context context, int appWidgetId) {
        Intent listClickIntent = new Intent(context, WidgetProvider.class);
        listClickIntent.setAction(ACTION_ON_CLICK);
        PendingIntent listClickPIntent = PendingIntent.getBroadcast(context, 0, listClickIntent, 0);
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
        if (intent.getAction().equalsIgnoreCase(ACTION_ON_CLICK)) {
            int itemPos = intent.getIntExtra(ITEM_POSITION, -1);
            if (itemPos != -1) {
                Toast.makeText(context, "Clicked on item " + itemPos, Toast.LENGTH_SHORT).show();
            }
        } else if (intent.getAction().equalsIgnoreCase(ACTION_OPEN_ADD)) {
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage("com.dailylist.vadimsemenyk");
            if (launchIntent != null) {
                context.startActivity(launchIntent);
            }
        }
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        super.onDeleted(context, appWidgetIds);
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
    }

}