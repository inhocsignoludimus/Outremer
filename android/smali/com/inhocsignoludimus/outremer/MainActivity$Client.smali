.class Lcom/inhocsignoludimus/outremer/MainActivity$Client;
.super Landroid/webkit/WebViewClient;

.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/inhocsignoludimus/outremer/MainActivity;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x18
    name = "Client"
.end annotation

.field private final am:Landroid/content/res/AssetManager;

.method constructor <init>(Landroid/content/res/AssetManager;)V
    .registers 2
    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V
    iput-object p1, p0, Lcom/inhocsignoludimus/outremer/MainActivity$Client;->am:Landroid/content/res/AssetManager;
    return-void
.end method

.method private static mime(Ljava/lang/String;)Ljava/lang/String;
    .registers 3
    invoke-virtual {p0}, Ljava/lang/String;->toLowerCase()Ljava/lang/String;
    move-result-object v0
    const-string v1, ".html"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-nez v1, :html
    const-string v1, ".htm"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :html
    const-string v1, ".js"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :js
    const-string v1, ".json"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-nez v1, :json
    const-string v1, ".map"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :json
    const-string v1, ".css"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :css
    const-string v1, ".png"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :png
    const-string v1, ".jpg"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-nez v1, :jpg
    const-string v1, ".jpeg"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :jpg
    const-string v1, ".webp"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :webp
    const-string v1, ".gif"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :gif
    const-string v1, ".svg"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :svg
    const-string v1, ".mp3"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :mp3
    const-string v1, ".ogg"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :ogg
    const-string v1, ".wav"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :wav
    const-string v1, ".woff2"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :woff2
    const-string v1, ".woff"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :woff
    const-string v1, ".ttf"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :ttf
    const-string v1, ".wasm"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :wasm
    const-string v1, ".txt"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :txt
    const-string v1, ".xml"
    invoke-virtual {v0, v1}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z
    move-result v1
    if-eqz v1, :xml
    const-string v0, "application/octet-stream"
    return-object v0
    :html
    const-string v0, "text/html"
    return-object v0
    :js
    const-string v0, "application/javascript"
    return-object v0
    :json
    const-string v0, "application/json"
    return-object v0
    :css
    const-string v0, "text/css"
    return-object v0
    :png
    const-string v0, "image/png"
    return-object v0
    :jpg
    const-string v0, "image/jpeg"
    return-object v0
    :webp
    const-string v0, "image/webp"
    return-object v0
    :gif
    const-string v0, "image/gif"
    return-object v0
    :svg
    const-string v0, "image/svg+xml"
    return-object v0
    :mp3
    const-string v0, "audio/mpeg"
    return-object v0
    :ogg
    const-string v0, "audio/ogg"
    return-object v0
    :wav
    const-string v0, "audio/wav"
    return-object v0
    :woff2
    const-string v0, "font/woff2"
    return-object v0
    :woff
    const-string v0, "font/woff"
    return-object v0
    :ttf
    const-string v0, "font/ttf"
    return-object v0
    :wasm
    const-string v0, "application/wasm"
    return-object v0
    :txt
    const-string v0, "text/plain"
    return-object v0
    :xml
    const-string v0, "application/xml"
    return-object v0
.end method

.method private static enc(Ljava/lang/String;)Ljava/lang/String;
    .registers 2
    const-string v0, "text/"
    invoke-virtual {p0, v0}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z
    move-result v0
    if-eqz v0, :utf
    const-string v0, "application/javascript"
    invoke-virtual {v0, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v0
    if-eqz v0, :utf
    const-string v0, "application/json"
    invoke-virtual {v0, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v0
    if-eqz v0, :utf
    const-string v0, "image/svg+xml"
    invoke-virtual {v0, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v0
    if-eqz v0, :utf
    const/4 v0, 0x0
    return-object v0
    :utf
    const-string v0, "utf-8"
    return-object v0
.end method

.method private static notFound()Landroid/webkit/WebResourceResponse;
    .registers 8
    new-instance v0, Landroid/webkit/WebResourceResponse;
    const-string v1, "text/plain"
    const-string v2, "utf-8"
    const/16 v3, 0x194
    const-string v4, "Not Found"
    new-instance v5, Ljava/util/HashMap;
    invoke-direct {v5}, Ljava/util/HashMap;-><init>()V
    new-instance v6, Ljava/io/ByteArrayInputStream;
    const/4 v7, 0x0
    new-array v7, v7, [B
    invoke-direct {v6, v7}, Ljava/io/ByteArrayInputStream;-><init>([B)V
    invoke-direct/range {v0 .. v6}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/util/Map;Ljava/io/InputStream;)V
    return-object v0
.end method

.method public shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .registers 12
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;
    move-result-object v0
    if-nez v0, :pass
    invoke-virtual {v0}, Landroid/net/Uri;->getHost()Ljava/lang/String;
    move-result-object v1
    const-string v2, "appassets.androidplatform.net"
    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v2
    if-nez v2, :pass
    invoke-virtual {v0}, Landroid/net/Uri;->getPath()Ljava/lang/String;
    move-result-object v1
    if-nez v1, :miss
    const-string v2, "/assets/"
    invoke-virtual {v1, v2}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z
    move-result v2
    if-nez v2, :miss
    const/16 v2, 0x8
    invoke-virtual {v1, v2}, Ljava/lang/String;->substring(I)Ljava/lang/String;
    move-result-object v3
    invoke-virtual {v3}, Ljava/lang/String;->length()I
    move-result v2
    if-nez v2, :miss
    const-string v2, ".."
    invoke-virtual {v3, v2}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z
    move-result v2
    if-eqz v2, :miss
    :try_start
    iget-object v2, p0, Lcom/inhocsignoludimus/outremer/MainActivity$Client;->am:Landroid/content/res/AssetManager;
    invoke-virtual {v2, v3}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;
    move-result-object v6
    invoke-static {v3}, Lcom/inhocsignoludimus/outremer/MainActivity$Client;->mime(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v1
    invoke-static {v1}, Lcom/inhocsignoludimus/outremer/MainActivity$Client;->enc(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v2
    new-instance v5, Ljava/util/HashMap;
    invoke-direct {v5}, Ljava/util/HashMap;-><init>()V
    const-string v7, "Access-Control-Allow-Origin"
    const-string v8, "*"
    invoke-virtual {v5, v7, v8}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;
    const-string v7, "Cache-Control"
    const-string v8, "no-store"
    invoke-virtual {v5, v7, v8}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;
    new-instance v0, Landroid/webkit/WebResourceResponse;
    const/16 v3, 0xc8
    const-string v4, "OK"
    invoke-direct/range {v0 .. v6}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/util/Map;Ljava/io/InputStream;)V
    :try_end
    .catch Ljava/lang/Exception; {:try_start .. :try_end} :catch
    return-object v0

    :catch
    :miss
    invoke-static {}, Lcom/inhocsignoludimus/outremer/MainActivity$Client;->notFound()Landroid/webkit/WebResourceResponse;
    move-result-object v0
    return-object v0

    :pass
    invoke-super {p0, p1, p2}, Landroid/webkit/WebViewClient;->shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    move-result-object v0
    return-object v0
.end method
