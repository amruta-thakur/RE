var Device = {
       getDevice: function() {
        var devices = ['iPad', 'iPhone', 'Android', 'Windows', 'Macintosh'];
        var device = "";
        for(var i=0;i<devices.length;i++){
            var isMatched = navigator.userAgent.match(devices[i]);
            if(isMatched){
                document.getElementById('body').className = devices[i];
            }
        }
        return (navigator.userAgent.match(/(iPad)/g) ? true : false);
    }
} ;