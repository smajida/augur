import { augur } from '../../../services/augurjs';
import { formatEther, formatShares } from '../../../utils/format-number';

import { SUCCESS, FAILED } from '../../transactions/constants/statuses';

import { updateExistingTransaction } from '../../transactions/actions/update-existing-transaction';

export function processAsk(transactionID, marketID, outcomeID, numShares, limitPrice) {
	return (dispatch, getState) => {
		if ((!limitPrice) || !numShares) {
			return dispatch(updateExistingTransaction(transactionID, { status: FAILED, message: `invalid limit price "${limitPrice}" or shares "${numShares}"` }));
		}

		dispatch(updateExistingTransaction(transactionID, { status: 'placing ask...', message: `asking ${numShares} shares @ ${formatEther(limitPrice).full}` }));

		ask(transactionID, marketID, outcomeID, limitPrice, numShares, dispatch, (err, res) => {
			if (err) {
				return dispatch(updateExistingTransaction(transactionID, { status: FAILED, message: err.message }));
			}
			return dispatch(updateExistingTransaction(transactionID, {
				status: SUCCESS,
				message: `ask ${formatShares(numShares).full} @ ${formatEther(limitPrice).full}`
			}));
		});
	};
}

function ask(transactionID, marketID, outcomeID, limitPrice, totalShares, dispatch, cb) {
	augur.sell({
		amount: totalShares,
		price: limitPrice,
		market: marketID,
		outcome: outcomeID,

		onSent: data => {
			dispatch(updateExistingTransaction(transactionID, { hash: data.txHash }));
			console.log('ask onSent', data);
		},
		onFailed: cb,
		onSuccess: data => cb(null, data)
	});
}
