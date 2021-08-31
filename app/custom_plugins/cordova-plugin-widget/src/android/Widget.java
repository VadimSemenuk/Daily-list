package com.dailylist.vadimsemenyk.widget;

import android.app.Activity;

import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayList;

public class Widget extends CordovaPlugin {
    private static WeakReference<CordovaWebView> webView = null;
    private static Boolean isWebAppListenEvents = false;
    private static ArrayList<String> eventQueue = new ArrayList<String>();

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);

        Widget.webView = new WeakReference<CordovaWebView>(webView);
    }

    public void onDestroy() {
        eventQueue.clear();
        isWebAppListenEvents = false;
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("fireEvents")) {
            isWebAppListenEvents = true;
            fireSavedEvents();
            return true;
        } else if (action.equals("update")) {
            String message = args.getString(0);
            this.echo(message, callbackContext);
            return true;
        }
        return false;
    }


    static boolean isAppRunning() {
        return webView != null;
    }

    private static synchronized void fireSavedEvents() {
        for (String js : eventQueue) {
            sendJavascript(js);
        }
        eventQueue.clear();
    }

    static void fireEvent (String event) {
        fireEvent(event, new JSONObject());
    }

    static void fireEvent(String event, JSONObject data) {
        String js = "cordova.plugins.widget.fireEvent(" + "\"" + event + "\"," + data.toString() + ")";
        sendJavascript(js);
    }

    private static synchronized void sendJavascript(final String js) {
        if (!isWebAppListenEvents || !isAppRunning()) {
            eventQueue.clear();
            eventQueue.add(js);
            return;
        }

        final CordovaWebView view = webView.get();

        ((Activity)(view.getContext())).runOnUiThread(new Runnable() {
            public void run() {
                view.loadUrl("javascript:" + js);
            }
        });
    }

    private void echo(String message, CallbackContext callbackContext) {
        if (message != null && message.length() > 0) {
            callbackContext.success(message);
        } else {
            callbackContext.error("Expected one non-empty string argument.");
        }
    }
}