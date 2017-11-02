/**
 * Created by Lanny on 2017/11/1.
 */
import React, {Component, PropTypes} from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    PanResponder,
    Animated,
} from 'react-native';
import clamp from 'clamp';
let imgIndex = 0;
const SWIPE_THRESHOLD = 120;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2d2d5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 18,
        color: '#111111',
    },
    wrapper: {
        position: 'absolute',
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: StyleSheet.hairlineWidth * 5,
        borderColor: "#88d3d3"
    },
    emptyCardTip: {
        fontSize: 22,
    },
    imgWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    }


});

export default class MagicSwipeCard extends Component {
    static propTypes = {
        cards: PropTypes.array,
        cardKey: PropTypes.string,
        hasMaybeAction: PropTypes.bool,
        loop: PropTypes.bool,
        onLoop: PropTypes.func,
        allowGestureTermination: PropTypes.bool,
        stack: PropTypes.bool,
        stackGuid: PropTypes.string,
        stackDepth: PropTypes.number,
        stackOffsetX: PropTypes.number,
        stackOffsetY: PropTypes.number,
        renderNoMoreCards: PropTypes.func,
        showYup: PropTypes.bool,
        showMaybe: PropTypes.bool,
        showNope: PropTypes.bool,
        handleYup: PropTypes.func,
        handleMaybe: PropTypes.func,
        handleNope: PropTypes.func,
        yupText: PropTypes.string,
        yupView: PropTypes.element,
        maybeText: PropTypes.string,
        maybeView: PropTypes.element,
        nopeText: PropTypes.string,
        noView: PropTypes.element,
        handleClick: PropTypes.func,
        renderCard: PropTypes.func,
        cardRemoved: PropTypes.func,
        dragY: PropTypes.bool,
        smoothTransition: PropTypes.bool

    };

    static defaultProps = {
        cards: [],
        cardKey: 'key',
        hasMaybeAction: false,
        loop: false,
        onLoop: () => null,
        allowGestureTermination: true,
        stack: false,
        stackDepth: 5,
        stackOffsetX: 25,
        stackOffsetY: 0,
        showYup: true,
        showMaybe: true,
        showNope: true,
        handleYup: (card) => null,
        handleMaybe: (card) => null,
        handleNope: (card) => null,
        nopeText: "Nope!",
        maybeText: "Maybe!",
        yupText: "Yup!",
        handleClick: () => {
            alert('tap')
        },
        onDragStart: () => {
        },
        onDragRelease: () => {
        },
        cardRemoved: (ix) => null,
        renderCard: (card) => null,
        style: styles.container,
        dragY: true,
        smoothTransition: false
    };

    constructor(props) {
        super(props);
        this.imgIndex = this.props.imgIndex || imgIndex++;
        if (!this.imgIndex) this.imgIndex = 0;
        this.state = {
            pan: new Animated.ValueXY({x: 0, y: 0}),
            enter: new Animated.Value(0.5),
            cards: [].concat(this.props.cards),
            card: this.props.cards[this.imgIndex],
        };

        this._panResponder = PanResponder.create({
            onStartShouldSetResponder: (evt, gestureState) => true,
            onStartShouldSetResponderCapture: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
            onPanResponderGrant: (evt, gestureState) => {
                this.state.pan.setOffset({x: this.state.pan.x._value, y: this.state.pan.y._value});
                this.state.pan.setValue({x: 0, y: 0})
            },
            onPanResponderMove: Animated.event([
                null, {dx: this.state.pan.x, dy: this.state.pan.y}
            ]),
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderTerminate: (evt, gestureState) => {

            },
            onPanResponderRelease: (evt, {vx, vy, dx, dy}) => {
                this.state.pan.flattenOffset();
                let velocity;
                if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {//只是单纯的点击，认为没有滑动
                    this.props.handleClick(this.state.card);
                }

                if (vx > 0) {
                    velocity = clamp(vx, 3, 5);
                } else if (vx < 0) {
                    velocity = clamp(vx * -1, 3, 5) * -1;
                } else {
                    velocity = dx < 0 ? -3 : 3;
                }

                //是否是水平或者垂直方向上有移动，
                let hasSwipedHorizontally = Math.abs(this.state.pan.x._value) > SWIPE_THRESHOLD;
                let hasSwipedVertically = Math.abs(this.state.pan.y._value) > SWIPE_THRESHOLD;
                if (hasSwipedHorizontally || (hasSwipedVertically && this.props.hasMaybeAction)) {
                    let cancelled = false;

                    let hasMovedRight = hasSwipedHorizontally && this.state.pan.x._value > 0;
                    let hasMovedLeft = hasSwipedHorizontally && this.state.pan.x._value < 0;
                    let hasMovedUp = hasSwipedVertically && this.state.pan.y._value < 0;

                    if (hasMovedRight) {
                        cancelled = this.props.handleYup(this.state.card);
                    } else if (hasMovedLeft) {
                        cancelled = this.props.handleNope(this.state.card);
                    } else if (hasMovedUp && this.props.hasMaybeAction) {
                        cancelled = this.props.handleMaybe(this.state.card);
                    } else {
                        cancelled = true;
                    }

                    //水平或者垂直方向没有做切换，把图片回归原位
                    if (cancelled) {
                        this._resetPan();
                        return;
                    }

                    this.props.cardRemoved(this.imgIndex);
                    this.cardAnimation = Animated.decay(this.state.pan, {
                        velocity: {x: velocity, y: vy},
                        deceleration: 0.98
                    });
                    this.cardAnimation.start((status) => {
                        if (status.finished) {
                            if (hasMovedRight) {
                                this._goToPreCard();
                            } else if (hasMovedLeft) {
                                this._goToNextCard();
                            }
                        } else {
                            this._resetState();
                        }

                        this.cardAnimation = null;
                    })
                } else {
                    this._resetPan();
                }


            },

        })
    }

    _resetPan() {
        Animated.spring(this.state.pan, {
            toValue: {x: 0, y: 0},
            friction: 4
        }).start()
    }

    _animateEntrance() {
        Animated.spring(
            this.state.enter,
            {toValue: 1, friction: 8}
        ).start();
    }

    _goToNextCard() {

        this.state.pan.setValue({x: 0, y: 0});
        this.state.enter.setValue(0);
        this._animateEntrance();
        this.imgIndex++;

        //如果是最后一张，且props.loop == true 则从第一张开始
        if (this.imgIndex > this.state.cards.length - 1 && this.props.loop) {
            this.props.onLoop();
            this.imgIndex = 0;
        }

        this.setState({
            card: this.state.cards[this.imgIndex]
        })
    }

    _goToPreCard() {

        this.state.pan.setValue({x: 0, y: 0});
        this.state.enter.setValue(0);
        this._animateEntrance();

        this.imgIndex--;
        if (this.imgIndex <= 0 && this.props.loop) {
            this.props.onLoop();
            this.imgIndex = this.state.cards.length - 1;
        }

        this.setState({
            card: this.state.cards[this.imgIndex]
        })
    }

    _resetState() {
        this.state.pan.setValue({x: 0, y: 0});
        this.state.enter.setValue(0);
        this._animateEntrance();
    }

    componentDidMount() {
        this._animateEntrance();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.cards !== this.props.cards) {
            if (this.cardAnimation) {
                this.cardAnimation.stop();
                this.cardAnimation = null;
            }

            this.imgIndex = 0;
            this.setState({
                cards: [].concat(nextProps.cards),
                card: nextProps.cards[0],
            });
        }
    }

    _renderNoCard() {
        return this.props.renderNoMoreCards || (<Text style={styles.emptyCardTip}>
                There are no more pictures !
            </Text>)
    }

    _renderCard() {
        if (!this.state.card) {
            return this._renderNoCard();
        }
        return (
            <Animated.View style={[styles.imgWrapper, {
                opacity: this.state.pan.y.interpolate({
                    inputRange: [-600, 0, 150, 600],
                    outputRange: [1, 1, 0.1, 0.05]
                })
            }]}>
                <Animated.View
                    style={[styles.wrapper, {
                        transform: [{
                            rotate: this.state.pan.x.interpolate({
                                inputRange: [-200, 0, 200],
                                outputRange: ['-30deg', '0deg', '30deg']
                            })
                        }, {translateY: this.state.pan.y}, {translateX: this.state.pan.x}, {
                            scale: this.state.pan.y.interpolate({
                                inputRange: [-300, 0, 300],
                                outputRange: [1, 1, 0.5]
                            })
                            // scale: this.state.enter
                        }]
                        , opacity: this.state.enter.interpolate({
                            inputRange: [-200, 0, 200],
                            outputRange: [1, 1, 0.8,]
                        })
                    }]} {...this._panResponder.panHandlers}>
                    {this.props.renderCard(this.state.card)}
                </Animated.View>
            </Animated.View>

        )
    }

    render() {
        return (
            <View style={styles.container}>
                {this._renderCard()}
            </View>
        )
    }
}
