import { Button, Stack, TextField } from '@matchbox/ui';
import type { ProfileBulletInput } from '@matchbox/shared';
import { useTranslation } from 'react-i18next';

type BulletEditorProps = {
    bullets: ProfileBulletInput[];
    onChange: (bullets: ProfileBulletInput[]) => void;
};

export function BulletEditor({ bullets, onChange }: BulletEditorProps) {
    const { t } = useTranslation('profile');

    return (
        <Stack spacing={1}>
            {bullets.map((bullet, index) => (
                <Stack direction="row" key={bullet.id ?? `new-${index}`} spacing={1}>
                    <TextField
                        data-test="profile-bullet-input"
                        dir="auto"
                        fullWidth
                        label={t('form.bullet')}
                        onChange={(event) => {
                            const next = [...bullets];
                            next[index] = { ...bullet, text: event.target.value };
                            onChange(next);
                        }}
                        value={bullet.text}
                    />
                    <Button
                        onClick={() => onChange(bullets.filter((_, rowIndex) => rowIndex !== index))}
                        variant="text"
                    >
                        {t('form.removeBullet')}
                    </Button>
                </Stack>
            ))}
            <Button onClick={() => onChange([...bullets, { text: '' }])} variant="text">
                {t('form.addBullet')}
            </Button>
        </Stack>
    );
}
