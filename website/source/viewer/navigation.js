OV.GetClientCoordinates = function (canvas, clientX, clientY) {
    if (canvas.getBoundingClientRect) {
        let clientRect = canvas.getBoundingClientRect();
        clientX -= clientRect.left;
        clientY -= clientRect.top;
    }
    if (window.pageXOffset && window.pageYOffset) {
        clientX += window.pageXOffset;
        clientY += window.pageYOffset;
    }
    return new OV.Coord2D(clientX, clientY);
};

OV.Camera = class {
    constructor(eye, center, up) {
        this.eye = eye;
        this.center = center;
        this.up = up;
    }

    Clone() {
        return new OV.Camera(
            this.eye.Clone(),
            this.center.Clone(),
            this.up.Clone()
        );
    }
};

OV.MouseInteraction = class {
    constructor() {
        this.prev = new OV.Coord2D(0.0, 0.0);
        this.curr = new OV.Coord2D(0.0, 0.0);
        this.diff = new OV.Coord2D(0.0, 0.0);
        this.buttons = [];
    }

    Down(canvas, ev) {
        this.buttons.push(ev.which);
        this.curr = this.GetCurrent(canvas, ev);
        this.prev = this.curr.Clone();
    }

    Move(canvas, ev) {
        this.curr = this.GetCurrent(canvas, ev);
        this.diff = OV.SubCoord2D(this.curr, this.prev);
        this.prev = this.curr.Clone();
    }

    Up(canvas, ev) {
        let buttonIndex = this.buttons.indexOf(ev.which);
        if (buttonIndex !== -1) {
            this.buttons.splice(buttonIndex, 1);
        }
        this.curr = this.GetCurrent(canvas, ev);
    }

    Leave(canvas, ev) {
        this.buttons = [];
        this.curr = this.GetCurrent(canvas, ev);
    }

    IsButtonDown() {
        return this.buttons.length > 0;
    }

    GetButton() {
        let length = this.buttons.length;
        if (length === 0) {
            return 0;
        }
        return this.buttons[length - 1];
    }

    GetMoveDiff() {
        return this.diff;
    }

    GetCurrent(canvas, ev) {
        return OV.GetClientCoordinates(canvas, ev.clientX, ev.clientY);
    }
};

OV.TouchInteraction = class {
    constructor() {
        this.prevPos = new OV.Coord2D(0.0, 0.0);
        this.currPos = new OV.Coord2D(0.0, 0.0);
        this.diffPos = new OV.Coord2D(0.0, 0.0);
        this.prevDist = 0.0;
        this.currDist = 0.0;
        this.diffDist = 0.0;
        this.fingers = 0;
    }

    Start(canvas, ev) {
        if (ev.touches.length === 0 || Object.keys(ev.touches).length === 0) {
            return;
        }
        this.fingers = ev.touches.length;

        this.currPos = this.GetCurrent(canvas, ev);
        this.prevPos = this.currPos.Clone();

        this.currDist = this.GetTouchDistance(canvas, ev);
        this.prevDist = this.currDist;
    }

    Move(canvas, ev) {
        if (ev.touches.length === 0 || Object.keys(ev.touches).length === 0) {
            return;
        }
        this.currPos = this.GetCurrent(canvas, ev);
        this.diffPos = OV.SubCoord2D(this.currPos, this.prevPos);
        this.prevPos = this.currPos.Clone();

        this.currDist = this.GetTouchDistance(canvas, ev);
        this.diffDist = this.currDist - this.prevDist;
        this.prevDist = this.currDist;
    }

    End(canvas, ev) {
        if (ev.touches.length === 0) {
            return;
        }

        this.fingers = 0;
        this.currPos = this.GetCurrent(canvas, ev);
        this.currDist = this.GetTouchDistance(canvas, ev);
    }

    IsFingerDown() {
        return this.fingers !== 0;
    }

    GetFingerCount() {
        return this.fingers;
    }

    GetMoveDiff() {
        return this.diffPos;
    }

    GetDistanceDiff() {
        return this.diffDist;
    }

    GetCurrent(canvas, ev) {
        let coord = null;
        if (ev.touches.length !== 0) {
            let touchEv = ev.touches[0];
            coord = OV.GetClientCoordinates(canvas, touchEv.pageX, touchEv.pageY);
        }
        return coord;
    }

    GetTouchDistance(canvas, ev) {
        if (ev.touches.length !== 2) {
            return 0.0;
        }
        let touchEv1 = ev.touches[0];
        let touchEv2 = ev.touches[1];
        let distance = OV.CoordDistance2D(
            OV.GetClientCoordinates(canvas, touchEv1.pageX, touchEv1.pageY),
            OV.GetClientCoordinates(canvas, touchEv2.pageX, touchEv2.pageY)
        );
        return distance;
    }
};

OV.ClickDetector = class {
    constructor() {
        this.isClick = false;
        this.button = 0;
    }

    Down(ev) {
        this.isClick = true;
        this.button = ev.which;
    }

    Move() {
        this.isClick = false;
    }

    Up(ev) {
        if (this.isClick && ev.which !== this.button) {
            this.isClick = false;
        }
    }

    Leave() {
        this.isClick = false;
        this.button = 0;
    }

    IsClick() {
        return this.isClick;
    }
};

OV.NavigationType = {
    None: 0,
    Orbit: 1,
    Pan: 2,
    Zoom: 3,
};

OV.Navigation = class {
    constructor(canvas, camera, socket, viewer) {
        this.canvas = canvas;
        this.camera = camera;
        this.socket = socket;
        this.viewer = viewer;
        //todo
        // this.myCamera = null;
        // this.myRenderer = null;
        // this.myScene = null;
        this.senderIndex = 0;
        this.loadinModel = true;

        this.orbitCenter = this.camera.center.Clone();
        this.fixUpVector = true;

        this.mouse = new OV.MouseInteraction();
        this.touch = new OV.TouchInteraction();
        this.clickDetector = new OV.ClickDetector();

        this.onUpdate = null;
        this.onClick = null;
        this.onContext = null;

        let flagCheckerForAccessNewJoined = false;


        //todo
        if (this.canvas.addEventListener) {
            //this.canvas.addEventListener('mousedown', this.OnMouseDown.bind(this));
            $('#viewer').bind('mousedown', this.OnMouseDown.bind(this));

            //$('#viewer').bind('wheel', this.OnMouseWheel.bind(this));

            this.canvas.addEventListener('wheel', this.OnMouseWheel.bind(this));

            //this.canvas.addEventListener('touchstart', this.OnTouchStart.bind(this));
            $('#viewer').bind('touchstart', this.OnTouchStart.bind(this));

            //this.canvas.addEventListener('touchmove', this.OnTouchMove.bind(this));
            $('#viewer').bind('touchmove', this.OnTouchMove.bind(this));

            //this.canvas.addEventListener('touchend', this.OnTouchEnd.bind(this));
            $('#viewer').bind('touchend', this.OnTouchEnd.bind(this));

            this.canvas.addEventListener(
                'contextmenu',
                this.OnContextMenu.bind(this)
            );
        }
        if (document.addEventListener) {
            //document.addEventListener('mousemove', this.OnMouseMove.bind(this));
            $(document).bind('mousemove', this.OnMouseMove.bind(this));
            $(document).bind('mouseup', this.OnMouseUp.bind(this));
            //document.addEventListener('mouseup', this.OnMouseUp.bind(this));
            document.addEventListener('mouseleave', this.OnMouseLeave.bind(this));
        }

        socket.on('newJoined', (flag, socketID) => {
            this.flagCheckerForAccessNewJoined = flag;
        });

        // socket.on('leave', (room, username) => {
        //     this.flagCheckerForAccessNewJoined = false;

        // });

        // socket.on('removeAll', (room, username) => {
        //     this.flagCheckerForAccessNewJoined = false;
        // });

        socket.on('on3DMouseDownReceiverFunc', (signal) => {
            this.OnMouseDown(signal);
        });

        socket.on('on3DMouseWheelReceiverFunc', (signal) => {
            this.OnMouseWheel(signal);
        });

        socket.on('on3DTouchStartReceiverFunc', (signal) => {
            this.OnTouchStart(signal);
        });

        socket.on('on3DTouchMoveReceiverFunc', (signal) => {
            this.OnTouchMove(signal);
        });

        socket.on('on3DTouchEndReceiverFunc', (signal) => {
            this.OnTouchEnd(signal);
        });

        // socket.on('on3DContextMenuReceiverFunc', (data) => {
        //     this.OnContextMenu(data);
        //     // socket.emit('my other event', { my: 'data' });
        // });

        socket.on('on3DMouseMoveReceiverFunc', (signal) => {
            this.OnMouseMove(signal);
        });

        socket.on('on3DMouseUpReceiverFunc', (signal) => {
            this.OnMouseUp(signal);
        });

        socket.on('on3DMouseLeaveReceiverFunc', (signal) => {
            this.OnMouseLeave(signal);
        });
    }

    SetLoadingModelNavigation(loading) {
        this.loadinModel = loading;
    }

    //todo
    // SetMyCamera(camera, renderer, scene) {
    //     this.myCamera = camera;
    //     this.myRenderer = renderer;
    //     this.myScene = scene;
    // }

    SetUpdateHandler(onUpdate) {
        this.onUpdate = onUpdate;
    }

    SetClickHandler(onClick) {
        this.onClick = onClick;
    }

    SetContextMenuHandler(onContext) {
        this.onContext = onContext;
    }

    IsFixUpVector() {
        return this.fixUpVector;
    }

    SetFixUpVector(fixUpVector) {
        this.fixUpVector = fixUpVector;
    }

    GetCamera() {
        return this.camera;
    }

    SetCamera(camera) {
        this.camera = camera;
    }

    MoveCamera(newCamera, stepCount) {
        function Step(obj, steps, count, index) {
            obj.camera.eye = steps.eye[index];
            obj.camera.center = steps.center[index];
            obj.camera.up = steps.up[index];
            obj.Update();

            if (index < count - 1) {
                requestAnimationFrame(() => {
                    Step(obj, steps, count, index + 1);
                });
            }
        }

        if (newCamera === null) {
            return;
        }

        if (stepCount === 0) {
            this.SetCamera(newCamera);
            return;
        }

        if (
            OV.CoordIsEqual3D(this.camera.eye, newCamera.eye) &&
            OV.CoordIsEqual3D(this.camera.center, newCamera.center) &&
            OV.CoordIsEqual3D(this.camera.up, newCamera.up)
        ) {
            return;
        }

        let tweenFunc = OV.ParabolicTweenFunction;
        let steps = {
            eye: OV.TweenCoord3D(
                this.camera.eye,
                newCamera.eye,
                stepCount,
                tweenFunc
            ),
            center: OV.TweenCoord3D(
                this.camera.center,
                newCamera.center,
                stepCount,
                tweenFunc
            ),
            up: OV.TweenCoord3D(this.camera.up, newCamera.up, stepCount, tweenFunc),
        };
        requestAnimationFrame(() => {
            Step(this, steps, stepCount, 0);
        });
        this.Update();
    }

    FitToSphere(center, radius, fov) {
        if (OV.IsZero(radius)) {
            return;
        }

        let fitCamera = this.GetFitToSphereCamera(center, radius, fov);
        this.camera = fitCamera;

        this.orbitCenter = this.camera.center.Clone();
        this.Update();
    }

    GetFitToSphereCamera(center, radius, fov) {
        if (OV.IsZero(radius)) {
            return null;
        }

        let fitCamera = this.camera.Clone();

        let offsetToOrigo = OV.SubCoord3D(fitCamera.center, center);
        fitCamera.eye = OV.SubCoord3D(fitCamera.eye, offsetToOrigo);
        fitCamera.center = center.Clone();

        let centerEyeDirection = OV.SubCoord3D(
            fitCamera.eye,
            fitCamera.center
        ).Normalize();
        let fieldOfView = fov / 2.0;
        if (this.canvas.width < this.canvas.height) {
            fieldOfView = (fieldOfView * this.canvas.width) / this.canvas.height;
        }
        let distance = radius / Math.sin(fieldOfView * OV.DegRad);

        fitCamera.eye = fitCamera.center
            .Clone()
            .Offset(centerEyeDirection, distance);
        this.orbitCenter = fitCamera.center.Clone();
        return fitCamera;
    }

    OnMouseDown(ev) {
        if (!this.loadinModel) {
            this.mouse.Down(this.canvas, ev);
            this.clickDetector.Down(ev);

            this.senderIndex = 0;

            if (!ev.state) {

                let ev_object = {
                    state: 'socket',
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    shiftKey: ev.shiftKey,
                    ctrlKey: ev.ctrlKey,
                    which: ev.which,
                    getCamera: this.GetCamera(),
                    from: this.socket.id,
                    user: this.socket.calluserID,
                    room: this.socket.roomID
                };
                if (this.flagCheckerForAccessNewJoined === true) {
                    this.socket.emit('on3DMouseDownReceiver', ev_object);
                }

            } else {
                $(document).unbind('mousemove');
                $('#viewer').unbind('mousedown');
                $(document).unbind('mouseup');


                $('#viewer').unbind('touchmove');
                $('#viewer').unbind('touchstart');
                $('#viewer').unbind('touchend');

                if (ev.getCamera !== null) {
                    this.MoveCamera(ev.getCamera, 2);
                }
                this.viewer.Render();
            }
        }
    }

    OnMouseMove(ev) {
        if (!this.loadinModel) {

            this.mouse.Move(this.canvas, ev);
            this.clickDetector.Move();

            if (!this.mouse.IsButtonDown()) {
                return;
            }

            let moveDiff = this.mouse.GetMoveDiff();
            let mouseButton = this.mouse.GetButton();

            let navigationType = OV.NavigationType.None;
            if (mouseButton === 1) {
                if (ev.ctrlKey) {
                    navigationType = OV.NavigationType.Zoom;
                } else if (ev.shiftKey) {
                    navigationType = OV.NavigationType.Pan;
                } else {
                    navigationType = OV.NavigationType.Orbit;
                }
            } else if (mouseButton === 2 || mouseButton === 3) {
                navigationType = OV.NavigationType.Pan;
            }

            if (navigationType === OV.NavigationType.Orbit) {
                let orbitRatio = 0.5;
                this.Orbit(moveDiff.x * orbitRatio, moveDiff.y * orbitRatio);
            } else if (navigationType === OV.NavigationType.Pan) {
                let eyeCenterDistance = OV.CoordDistance3D(
                    this.camera.eye,
                    this.camera.center
                );
                let panRatio = 0.001 * eyeCenterDistance;
                this.Pan(moveDiff.x * panRatio, moveDiff.y * panRatio);
            } else if (navigationType === OV.NavigationType.Zoom) {
                let zoomRatio = 0.005;
                this.Zoom(-moveDiff.y * zoomRatio);
            }

            if (!ev.state) {
                let ev_object = {
                    state: 'socket',
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    shiftKey: ev.shiftKey,
                    ctrlKey: ev.ctrlKey,
                    which: ev.which,
                    from: this.socket.id,
                    user: this.socket.calluserID,
                    room: this.socket.roomID
                };
                if (this.flagCheckerForAccessNewJoined === true) {
                    if (this.senderIndex % 2 === 0)
                        this.socket.emit('on3DMouseMoveReceiver', ev_object);
                }
                this.senderIndex++;
            }

            this.Update();
        }
    }

    OnMouseUp(ev) {
        if (!this.loadinModel) {
            this.mouse.Up(this.canvas, ev);
            this.clickDetector.Up(ev);
            if (this.clickDetector.IsClick()) {
                this.Click(ev.which, ev.clientX, ev.clientY);
            }
            if (!ev.state) {

                let ev_object = {
                    state: 'socket',
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    shiftKey: ev.shiftKey,
                    ctrlKey: ev.ctrlKey,
                    which: ev.which,
                    from: this.socket.id,
                    user: this.socket.calluserID,
                    room: this.socket.roomID
                };
                if (this.flagCheckerForAccessNewJoined === true)
                    this.socket.emit('on3DMouseUpReceiver', ev_object);

            } else {
                $(document).bind('mousemove', (ev) => {
                    this.OnMouseMove(ev);
                });
                $('#viewer').bind('mousedown', (ev) => {
                    this.OnMouseDown(ev);
                });
                $(document).bind('mouseup', (ev) => {
                    this.OnMouseUp(ev);
                });

                $('#viewer').bind('touchmove', (ev) => {
                    this.OnTouchMove(ev);
                });
                $('#viewer').bind('touchstart', (ev) => {
                    this.OnTouchStart(ev);
                });
                $('#viewer').bind('touchend', (ev) => {
                    this.OnTouchEnd(ev);
                });

            }
        }
    }

    OnMouseLeave(ev) {
        if (!this.loadinModel) {

            this.mouse.Leave(this.canvas, ev);
            this.clickDetector.Leave();

            if (!ev.state) {
                let ev_object = {
                    state: 'socket',
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    shiftKey: ev.shiftKey,
                    ctrlKey: ev.ctrlKey,
                    which: ev.which,
                    from: this.socket.id,
                    user: this.socket.calluserID,
                    room: this.socket.roomID
                };
                if (this.flagCheckerForAccessNewJoined === true)
                    this.socket.emit('on3DMouseLeaveReceiver', ev_object);
            }
        }
    }

    OnTouchStart(ev) {
        if (!this.loadinModel) {

            $('#enter-id').blur();
            $('#chat-input').blur();

            this.senderIndex = 0;

            this.touch.Start(this.canvas, ev);

            if (!ev.state) {

                let touchObjectArray = [];
                let touchEv1 = ev.touches[0];

                touchObjectArray[0] = {
                    pageX: touchEv1.pageX,
                    pageY: touchEv1.pageY,
                };

                try {
                    let touchEv2 = ev.touches[1];
                    touchObjectArray[1] = {
                        pageX: touchEv2.pageX,
                        pageY: touchEv2.pageY,
                    };
                } catch (e) {
                }

                let ev_object = {
                    state: 'socket',
                    touchLength: ev.touches.length,
                    touches: touchObjectArray,
                    getCamera: this.GetCamera(),
                    from: this.socket.id,
                    user: this.socket.calluserID,
                    room: this.socket.roomID
                };
                if (this.flagCheckerForAccessNewJoined === true)
                    this.socket.emit('on3DTouchStartReceiver', ev_object);

            } else {
                $('#viewer').unbind('touchmove');
                $('#viewer').unbind('touchstart');
                $('#viewer').unbind('touchend');

                $(document).unbind('mousemove');
                $('#viewer').unbind('mousedown');
                $(document).unbind('mouseup');

                if (ev.getCamera !== null) {
                    this.MoveCamera(ev.getCamera, 2);
                }

                this.viewer.Render();
            }
        }
    }

    OnTouchMove(ev) {
        if (!this.loadinModel) {

            try {
                ev.preventDefault();
            } catch (e) {
            }

            this.touch.Move(this.canvas, ev);
            if (!this.touch.IsFingerDown()) {
                return;
            }

            let moveDiff = this.touch.GetMoveDiff();
            let distanceDiff = this.touch.GetDistanceDiff();
            let fingerCount = this.touch.GetFingerCount();

            if (fingerCount === 1) {
                let orbitRatio = 0.5;
                this.Orbit(moveDiff.x * orbitRatio, moveDiff.y * orbitRatio);

            } else if (fingerCount === 2) {
                let zoomRatio = 0.005;
                this.Zoom(distanceDiff * zoomRatio);
                let panRatio = 0.001 * OV.CoordDistance3D(this.camera.eye, this.camera.center);
                this.Pan(moveDiff.x * panRatio, moveDiff.y * panRatio);
            }

            if (fingerCount === 1) {
                let touch = ev.touches[0];
                const obj1 = {
                    pageX: touch.pageX,
                    pageY: touch.pageY,
                };
                if (!ev.state) {
                    let ev_object = {
                        state: 'socket',
                        from: this.socket.id,
                        user: this.socket.calluserID,
                        room: this.socket.roomID,
                        getCamera: this.GetCamera(),
                        touches: [obj1]
                    };
                    if (this.flagCheckerForAccessNewJoined === true)
                        if (this.senderIndex % 2 === 0)
                            this.socket.emit('on3DTouchMoveReceiver', ev_object);
                    this.senderIndex++;
                } else {
                    if (ev.getCamera !== null) {
                        this.MoveCamera(ev.getCamera, 2);
                    }
                    this.viewer.Render();
                }
            } else if (fingerCount === 2) {
                let touchEv1 = ev.touches[0];
                let touchEv2 = ev.touches[1];

                const obj1 = {
                    pageX: touchEv1.pageX,
                    pageY: touchEv1.pageY,
                };
                const obj2 = {
                    pageX: touchEv2.pageX,
                    pageY: touchEv2.pageY,
                };

                if (!ev.state) {
                    let ev_object = {
                        state: 'socket',
                        touches: [obj1, obj2],
                        getCamera: this.GetCamera(),
                        from: this.socket.id,
                        user: this.socket.calluserID,
                        room: this.socket.roomID
                    };
                    if (this.flagCheckerForAccessNewJoined === true) {
                        if (this.senderIndex % 2 === 0)
                            this.socket.emit('on3DTouchMoveReceiver', ev_object);
                    }
                    this.senderIndex++;
                } else {
                    if (ev.getCamera !== null) {
                        this.MoveCamera(ev.getCamera, 2);
                    }
                    this.viewer.Render();
                }
            }

            this.Update();
        }
    }

    OnTouchEnd(ev) {
        if (!this.loadinModel) {

            if (!ev.state) {
                const touch = ev.changedTouches[0];
                const obj = {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    force: touch.force,
                    length: touch.length,
                    identifier: touch.identifier,
                    pageX: touch.pageX,
                    pageY: touch.pageY,
                    radiusX: touch.radiusX,
                    radiusY: touch.radiusY,
                    rotationAngle: touch.rotationAngle,
                    screenX: touch.screenX,
                    screenY: touch.screenY
                };

                let ev_object = {
                    state: 'socket',
                    changedTouches: [obj, ev.changedTouches['length']],
                    targetTouches: [[], ev.changedTouches['length']],
                    touches: [[], ev.changedTouches['length']],
                    getCamera: this.GetCamera(),
                    from: this.socket.id,
                    user: this.socket.calluserID,
                    room: this.socket.roomID
                };
                if (this.flagCheckerForAccessNewJoined === true)
                    this.socket.emit('on3DTouchEndReceiver', ev_object);

            } else {

                $('#viewer').bind('touchmove', (ev) => {
                    this.OnTouchMove(ev);
                });
                $('#viewer').bind('touchstart', (ev) => {
                    this.OnTouchStart(ev);
                });
                $('#viewer').bind('touchend', (ev) => {
                    this.OnTouchEnd(ev);
                });

                $(document).bind('mousemove', (ev) => {
                    this.OnMouseMove(ev);
                });
                $('#viewer').bind('mousedown', (ev) => {
                    this.OnMouseDown(ev);
                });
                $(document).bind('mouseup', (ev) => {
                    this.OnMouseUp(ev);
                });

                if (ev.getCamera !== null) {
                    this.MoveCamera(ev.getCamera, 2);
                }
                this.viewer.Render();
            }

            this.touch.End(this.canvas, ev);
        }
    }

    OnMouseWheel(ev) {
        if (!this.loadinModel) {
            let params = ev || window.event;

            let delta = -params.deltaY / 40;
            let ratio = 0.1;
            if (delta < 0) {
                ratio = ratio * -1.0;
            }

            this.Zoom(ratio);

            if (!ev.state) {
                let ev_object = {
                    state: 'socket',
                    deltaY: ev.deltaY,
                    getCamera: this.GetCamera(),
                    from: this.socket.id,
                    user: this.socket.calluserID,
                    room: this.socket.roomID
                };
                if (this.flagCheckerForAccessNewJoined === true)
                    this.socket.emit('on3DMouseWheelReceiver', ev_object);

            } else {
                if (ev.getCamera !== null) {
                    this.MoveCamera(ev.getCamera, 2);
                }
                this.viewer.Render();
            }

            this.Update();
        }
    }

    OnContextMenu(ev) {
        ev.preventDefault();

        this.clickDetector.Up(ev);
        if (this.clickDetector.IsClick()) {
            //todo
            // this.Context(ev.clientX, ev.clientY);
        }
    }

    Orbit(angleX, angleY) {
        let radAngleX = angleX * OV.DegRad;
        let radAngleY = angleY * OV.DegRad;

        let viewDirection = OV.SubCoord3D(
            this.camera.center,
            this.camera.eye
        ).Normalize();
        let horizontalDirection = OV.CrossVector3D(
            viewDirection,
            this.camera.up
        ).Normalize();
        let differentCenter = !OV.CoordIsEqual3D(
            this.orbitCenter,
            this.camera.center
        );

        if (this.fixUpVector) {
            let originalAngle = OV.VectorAngle3D(viewDirection, this.camera.up);
            let newAngle = originalAngle + radAngleY;
            if (OV.IsGreater(newAngle, 0.0) && OV.IsLower(newAngle, Math.PI)) {
                this.camera.eye.Rotate(
                    horizontalDirection,
                    -radAngleY,
                    this.orbitCenter
                );
                if (differentCenter) {
                    this.camera.center.Rotate(
                        horizontalDirection,
                        -radAngleY,
                        this.orbitCenter
                    );
                }
            }
            this.camera.eye.Rotate(this.camera.up, -radAngleX, this.orbitCenter);
            if (differentCenter) {
                this.camera.center.Rotate(this.camera.up, -radAngleX, this.orbitCenter);
            }
        } else {
            let verticalDirection = OV.CrossVector3D(
                horizontalDirection,
                viewDirection
            ).Normalize();
            this.camera.eye.Rotate(horizontalDirection, -radAngleY, this.orbitCenter);
            this.camera.eye.Rotate(verticalDirection, -radAngleX, this.orbitCenter);
            if (differentCenter) {
                this.camera.center.Rotate(
                    horizontalDirection,
                    -radAngleY,
                    this.orbitCenter
                );
                this.camera.center.Rotate(
                    verticalDirection,
                    -radAngleX,
                    this.orbitCenter
                );
            }
            this.camera.up = verticalDirection;
        }
    }

    Pan(moveX, moveY) {
        let viewDirection = OV.SubCoord3D(
            this.camera.center,
            this.camera.eye
        ).Normalize();
        let horizontalDirection = OV.CrossVector3D(
            viewDirection,
            this.camera.up
        ).Normalize();
        let verticalDirection = OV.CrossVector3D(
            horizontalDirection,
            viewDirection
        ).Normalize();

        this.camera.eye.Offset(horizontalDirection, -moveX);
        this.camera.center.Offset(horizontalDirection, -moveX);

        this.camera.eye.Offset(verticalDirection, moveY);
        this.camera.center.Offset(verticalDirection, moveY);
    }

    Zoom(ratio) {
        let direction = OV.SubCoord3D(this.camera.center, this.camera.eye);
        let distance = direction.Length();
        let move = distance * ratio;
        this.camera.eye.Offset(direction, move);
    }

    Update() {
        if (this.onUpdate) {
            this.onUpdate();
        }
    }

    Click(button, clientX, clientY) {
        if (this.onClick) {
            let mouseCoords = OV.GetClientCoordinates(this.canvas, clientX, clientY);
            this.onClick(button, mouseCoords);
        }
    }

    Context(clientX, clientY) {
        if (this.onContext) {
            let globalCoords = {
                x: clientX,
                y: clientY,
            };
            let localCoords = OV.GetClientCoordinates(this.canvas, clientX, clientY);
            this.onContext(globalCoords, localCoords);
        }
    }
};
