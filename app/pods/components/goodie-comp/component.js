import Component from '@ember/component';
import { alias, equal } from '@ember/object/computed';
import { computed } from '@ember/object';
import DS from 'ember-data';
import { inject as service } from '@ember/service';

export default Component.extend({
    api: service(),
    router: service(),

    isDisabled: false,
    showModal: false,
    collapsed: true,
    tshirt: '',

    progress: computed('runAttempt', function () {
        return DS.PromiseObject.create({
            promise: this.api.request(`run_attempts/${this.runAttempt.id}/progress`)
        })
    }),
    run: alias('runAttempt.run'),
    goodieRequests: alias('runAttempt.goodieRequests'),
    statusInProgress: alias('goodieRequests.statusInProgress'),
    thresholdCompleted: computed('statusInProgress','alreadyClaimed','progress', 'run.goodiesThreshold', function () {
        const thresholdCompleted = this.progress.then(progress => {
            return progress.completedContents / progress.totalContents > (this.get('run.goodiesThreshold')/100)
        })
        return DS.PromiseObject.create({
            promise: thresholdCompleted
        })
    }),

    canClaim: alias('thresholdCompleted'),
    alreadyClaimed: equal('statusInProgress', 'requested'),
    completed: equal('statusInProgress', 'completed'),
    
    actions: {
        toggleCollapse() {
            this.toggleProperty('collapsed');
        },
        toggleModal() {
            this.toggleProperty('showModal');
        },
        saveForm() {
            this.toggleProperty('isDisabled');

            let formInfo = {
                name: this.get('name'),
                tshirt: this.tshirt,
                address: this.get('address').replace(/\n/g, " ")
            }

            this.get('goodieRequests').set('formInfo', formInfo)
            this.get('goodieRequests').set('statusInProgress', 'requested')

            this.get('goodieRequests').save()
            .then(() => {
                this.toggleProperty('showModal');
            })

            this.toggleProperty('isDisabled');
        }
    }
});
