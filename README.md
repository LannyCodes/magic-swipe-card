# magic-swipe-card
这是根据panResponder拖动而伴随着变大变小、旋转、透明度变化切换图片的组件，主要参考了react-native-swipe-cards这个写法，本人主要是为了学习panResponder的使用的，因此感谢原作者的辛勤付出！
使用步骤如下：
```
npm install magic-swipe-card --save
```
```
import MagicSwipeCard from 'magic-swipe-card';
render() {
        return (
            <MagicSwipeCard
                cards={this.state.cards}
                loop={true}
                // stackOffsetX={30}
                // stackOffsetY={40}
                renderCard={(cardData) => <Card {...cardData} />}
                renderNoMoreCards={() => <NoMoreCards />}
                showYup={true}
                showNope={true}
                // stack={true}
                // stackDepth={15}
                handleYup={this.handleYup}
                handleNope={this.handleNope}
                cardRemoved={this.cardRemoved.bind(this)}
            />
        )
}
```
有黑色遮罩是主要想做到类似今日头条浏览一组图片时可以下滑时黑色背景透明度逐渐加大的效果，如果不想要黑色遮罩，把MagicSwipeCard.js里边的_renderCard()改为如下：
```
_renderCard() {
        if (!this.state.card) {
            return this._renderNoCard();
        }
        return (
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
        )
 }
 ```
