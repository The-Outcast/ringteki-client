import AbilityContext = require('../AbilityContext');
import BaseCard = require('../basecard');
import BaseCardSelector = require('../CardSelectors/BaseCardSelector');
import CardSelector = require('../CardSelector');

import { CardGameAction, CardActionProperties } from './CardGameAction';
import { CardTypes, Players, Locations, EffectNames } from '../Constants';
import { GameAction } from './GameAction';

export interface SelectCardProperties extends CardActionProperties {
    activePromptTitle?: string;
    player?: Players;
    cardType?: CardTypes | CardTypes[];
    controller?: Players;
    location?: Locations | Locations[];
    cardCondition?: (card: BaseCard, context: AbilityContext) => boolean;
    targets?: boolean;
    message?: string;
    messageArgs?: (card: BaseCard, action: GameAction) => any[];
    gameAction: GameAction;
    selector?: BaseCardSelector;
}

export class SelectCardAction extends CardGameAction {
    defaultProperties: SelectCardProperties = {
        cardCondition: () => true,
        gameAction: null
    };

    constructor(properties: SelectCardProperties | ((context: AbilityContext) => SelectCardProperties)) {
        super(properties);
    }

    getEffectMessage(): [string, any[]] {
        return ['choose a target for {0}',[]];
    }

    getProperties(context, additionalProperties = {}) {
        let properties = super.getProperties(context, additionalProperties) as SelectCardProperties;
        let cardCondition = (card, context) => properties.gameAction.canAffect(card, context) && properties.cardCondition(card, context)
        properties.selector = CardSelector.for(Object.assign({}, properties, { cardCondition }));
        return properties;
    }

    canAffect(card, context, additionalProperties = {}) {
        let properties = this.getProperties(context, additionalProperties);
        return properties.selector.canTarget(card, context);
    }

    hasLegalTarget(context, additionalProperties = {}) {
        let properties = this.getProperties(context, additionalProperties);
        return properties.selector.hasEnoughTargets(context);
    }

    addEventsToArray(events, context, additionalProperties = {}) {
        let properties = this.getProperties(context, additionalProperties);
        if(!properties.selector.hasEnoughTargets(context) || properties.player === Players.Opponent && !context.player.opponent) {
            return;
        }
        let player = properties.player === Players.Opponent ? context.player.opponent : context.player;
        let mustSelect = [];
        if(properties.targets) {
            mustSelect = properties.selector.getAllLegalTargets(context).filter(card =>
                card.getEffects(EffectNames.MustBeChosen).some(restriction => restriction.isMatch('target', context))
            );
        }
        let defaultProperties = {
            context: context,
            selector: properties.selector,
            mustSelect: mustSelect,
            onSelect: (player, cards) => {
                if(properties.message) {
                    context.game.addMessage(properties.message, ...properties.messageArgs(cards, properties.gameAction));
                }
                properties.gameAction.addEventsToArray(events, context, { target: cards });
                return true;
            }
        };
        context.game.promptForSelect(player, Object.assign(defaultProperties, properties));
    }
}
