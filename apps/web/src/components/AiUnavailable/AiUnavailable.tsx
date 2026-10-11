import { Alert, Button } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

type AiUnavailableProps = {
    message: string;
    pending?: boolean;
    onRetry: () => void;
};

export function AiUnavailable({ message, pending = false, onRetry }: AiUnavailableProps) {
    const { t } = useTranslation('common');

    return (
        <Alert
            action={
                <Button data-test="ai-unavailable-retry-button" disabled={pending} onClick={onRetry}>
                    {t('ai.tryAgain')}
                </Button>
            }
            data-test="ai-unavailable"
            severity="warning"
        >
            {message}
        </Alert>
    );
}
