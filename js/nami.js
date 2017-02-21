window.Nami = (function(){
    var makeArray = function(list) {
        return Array.prototype.slice.call(list);
    };
    
    var active = document.querySelector(".nami-active") ? document.querySelector(".nami-active").getAttribute("data-name") : null;
    
    var Nami = {
        menu: {
            "default": {
                text: "Home",
                el: document.querySelector(".nami")
            }
        }
    };
    
    var namiMenuSelector = ".nami-menu .nami-menu-items";
    var namiMenuItemSelector = ".nami-menu-item";
    var namiSubMenuSelector = ".nami-submenu";
    var namiSubMenuItemSelector = namiSubMenuSelector + " .nami-sub-item";
    
    function addItem(key, item) {
        if(!Nami.menu[key]) {
            Nami.menu[key] = item;
        }
        return Nami.menu[key];
    }
    
    function getItem(key) {
        if(Nami.menu[key])
            return Nami.menu[key];  
        else
            return key + " could not be found";
    }

    
    function extractMenuItems(selector) {
        var namiEl = document.querySelector(selector);    
        var menuItems = makeArray(namiEl.querySelectorAll(namiMenuItemSelector));
        
        menuItems.forEach(function(menuItem) {
            createNamiMenuItem(menuItem);
        });
    }
    
    function extractSubMenuItemNames(el) {
        var menuChildren = makeArray(el.querySelector(namiSubMenuSelector).children);
        var subMenu = menuChildren.map(function(child){
            if(child.classList.contains("nami-sub-item")) {
                var text = child.getAttribute("data-name");
                return text;
            }
        });
        return subMenu;
    }
    
    function createNamiMenuItem(el) {
        var menuItem = {};
        menuItem.text = el.getAttribute("data-name");
        menuItem.el = el;
       
        menuItem.next = el.classList.contains("has-submenu") ?
            extractSubMenuItemNames(el): null;
        
        var addedMenuItem = addItem(menuItem.text, menuItem);
        return addedMenuItem;
    }
    
    function toggleMenu(e) {
        e.stopPropagation() || (e.cancelBubble = true);
        var namiMenu = document.querySelector(".nami-menu");
        if(!namiMenu.classList.contains("menu-open")) {
            namiMenu.classList.add("menu-open");
        }
        else
            namiMenu.classList.remove("menu-open");
    }
    
    function run() {
        extractMenuItems(namiMenuSelector);
        NamiEvents.register("toggleMenu", "default", "click", toggleMenu);
        attachMenuItemListeners();
        var display = document.querySelector(".nami-ishere");
        display.innerText = active;
    }
    
    function attachMenuItemListeners() {
        //update display in nami bar
        function updateNamiDisplay(e) {
            e.stopPropagation();
            var display = document.querySelector(".nami-ishere");
            display.innerText = this.text;
        }
        
    
        function closeMenu(e) {
            e.stopPropagation() || (e.cancelBubble = true);
            var namiMenu = document.querySelector(".nami-menu");
            if(namiMenu.classList.contains("menu-open")) {
                namiMenu.classList.remove("menu-open");
            }
        }
        
        function toggleSubMenu(e) {
            e.stopPropagation();
            var subMenu = this.el.querySelector(".nami-submenu");
            if(!subMenu.classList.contains("menu-open"))
                subMenu.classList.add("menu-open");
            else
                subMenu.classList.remove("menu-open");
        }
        
        var menuKeys = Object.keys(Nami.menu);
    
        menuKeys.forEach(function(menuKey){
            var menuItem = Nami.getItem(menuKey);
            NamiEvents.register("updateDisplay", menuItem.text, "click", updateNamiDisplay.bind(menuItem));
            NamiEvents.register("closeMenu", menuItem.text, "click", closeMenu);
            if(menuItem.next != null) {
                NamiEvents.register("toggleSubMenu", menuItem.text, "click", toggleSubMenu.bind(menuItem), ".nami-menu-trigger");
            }
            
        })
        
    }
    
    
    Nami.run = run;
    
    Nami.getItem = getItem;
    return Nami;
})();


window.NamiEvents = (function(){
    var events = {};
    
    function register(event, trigger, domEvent, cb) {
        var wantedTrigger = arguments[4] || null;
        var eventExists = false;
        events[event] = events[event] ? events[event] : [];
        var eventOb = {
            trigger: trigger,
            event: event,
            cb: cb,
            wantedTrigger: wantedTrigger
        }
        
        events[event].forEach(function(listener) {
            if(listener.trigger === eventOb.trigger && listener.event === eventOb.trigger) {
                eventExists = true;
            }
        })
        
        if(!eventExists)
            events[event].push(eventOb);
        
        if(wantedTrigger) {
            var wantedTriggerEl = Nami.getItem(trigger).el.querySelector(wantedTrigger);
            wantedTriggerEl.addEventListener(domEvent, eventOb.cb);
        }
        else {
            var specifiedTriggerEl = Nami.getItem(trigger).el;
            specifiedTriggerEl.addEventListener(domEvent, eventOb.cb);
        }
    }
    
    function deregister(event, trigger, domEvent) {
        var listeners = events[event];
        if(!listeners)
            return "No listeners for this event: " + event;
            
        listeners.forEach(function(listener) {
            if(listener.trigger === trigger) {
                var menuItem = Nami.getItem(trigger);
                var el = listener.wantedTrigger ? menuItem.el.querySelector(listener.wantedTrigger) : menuItem.el;
                console.log("Removing listener on", trigger);
                el.removeEventListener(domEvent || "click", listener.cb);
                listeners.splice(listeners.indexOf(listener), 1);
            }
        });
    }
    
    function fire(event, trigger) {
        var listeners = events[event];
        if(!listeners) {
            return "No listeners for this event: " + event;
        }
        
        //use hash instead of iterating? O(1) vs O(n) that important here?
        listeners.forEach(function(listener) {
            if(listener.trigger === trigger) {
                listener.cb({
                    stopPropagation: function noop() {} //since event is manually triggered (simply put, callback specified is invoked), we don't have access to the dom event obj so yes, this is a hack
                });
            }
        })
    }
    
    
    return {
        register: register, 
        deregister: deregister,
        events: events,
        fire: fire
    }
})()

window.Nami.run();