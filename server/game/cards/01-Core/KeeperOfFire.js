const RoleCard = require('../../rolecard.js');
const { Elements } = require('../../Constants');

class KeeperOfFire extends RoleCard {
    setupCardAbilities(ability) {
        this.reaction({
            title: 'Gain 1 fate',
            when: {
                afterConflict: (event, context) => event.conflict.elements.some(element => this.hasTrait(element)) &&
                                                   event.conflict.winner === context.player &&
                                                   event.conflict.defendingPlayer === context.player
            },
            gameAction: ability.actions.gainFate()
        });
    }

    getElement() {
        return [Elements.Fire];
    }
}

KeeperOfFire.id = 'keeper-of-fire';

module.exports = KeeperOfFire;
