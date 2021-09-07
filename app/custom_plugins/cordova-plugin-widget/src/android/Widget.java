package com.dailylist.vadimsemenyk.widget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Intent;

import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.HashMap;

public class Widget extends CordovaPlugin {
    private static WeakReference<CordovaWebView> webView = null;
    private static Boolean isWebAppListenEvents = false;
    private static HashMap<String, String> scheduledEvents = new HashMap();

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);

        Widget.webView = new WeakReference<CordovaWebView>(webView);
    }

    public void onDestroy() {
        scheduledEvents.clear();
        isWebAppListenEvents = false;
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("eventAdded")) {
            isWebAppListenEvents = true;

            String event = args.getString(0);
            fireScheduledEvent(event);
            return true;
        } else if (action.equals("update")) {
            update();
            return true;
        }
        return false;
    }


    static boolean isAppRunning() {
        return webView != null;
    }

    private static synchronized void fireScheduledEvent(String event) {
        sendJavascript(scheduledEvents.get(event));
        scheduledEvents.remove(event);
    }

    static void fireEvent(String event, boolean scheduleEvent) {
        fireEvent(event, new JSONObject(), scheduleEvent);
    }

    static void fireEvent(String event, JSONObject data, boolean scheduleEvent) {
        String js = "cordova.plugins.widget.fireEvent(" + "\"" + event + "\"," + data.toString() + ")";

        if (!isWebAppListenEvents || !isAppRunning()) {
            if (scheduleEvent) {
                scheduledEvents.put(event, js);
            }
            return;
        }

        sendJavascript(js);
    }

    private static synchronized void sendJavascript(final String js) {
        final CordovaWebView view = webView.get();

        ((Activity)(view.getContext())).runOnUiThread(new Runnable() {
            public void run() {
                view.loadUrl("javascript:" + js);
            }
        });
    }

    private void update() {
        Intent updateIntent = new Intent(cordova.getContext(), WidgetProvider.class);
        updateIntent.setAction(WidgetProvider.ACTION_UPDATE);
        cordova.getContext().sendBroadcast(updateIntent);
    }
}