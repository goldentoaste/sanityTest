'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FormTextInput, Input } from '@/components/ui/input/input';
import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
    ResponsiveDialogDescription,
    ResponsiveDialogFooter,
    ResponsiveDialogClose,
} from '@/components/ui/responsive-dialog';
import { toast } from '@/hooks/use-toast';
import { UserGroupIcon } from '@heroicons/react/24/solid';
import { Conditional } from '@/lib/Conditional';
import useMediaQuery from 'beautiful-react-hooks/useMediaQuery';

export default function CreateTeamForm({
    hackathonId,
}: {
    hackathonId: number;
}) {
    const router = useRouter();
    const createTeam = trpc.teams.createTeam.useMutation();
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const [teamInfo, setTeamInfo] = useState({
        teamName: '',
        teamPicture: '',
        _isDirty: false,
    });
    const isTeamNameError = teamInfo.teamName === '' && teamInfo._isDirty;
    const errorMsg = isTeamNameError ? 'Team name is required.' : undefined;
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [disabled, setDisabled] = useState<boolean>(true);
    const [isCreating, setIsCreating] = useState<boolean>(false);

    useEffect(() => {
        setDisabled(!teamInfo.teamName || !teamInfo.teamPicture || isCreating);
    }, [teamInfo.teamName, teamInfo.teamPicture, isCreating]);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Basic verification of the file type, size, and dimensions on client side, with temporary creation of a URL for the image, swap to R2 when ready
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/png', 'image/jpeg'].includes(file.type)) {
            setError(
                'Invalid file type. Only .png and .jpeg files are allowed.'
            );
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('File size must be less than 2MB.');
            return;
        }

        // Validate image dimensions (at least 200x200)
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            if (img.width < 200 || img.height < 200) {
                setError('Image must be at least 200px x 200px.');
                URL.revokeObjectURL(img.src);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setTeamInfo((prevState) => ({
                    ...prevState,
                    teamPicture: reader.result as string,
                }));
                setError(null);
            };
            reader.readAsDataURL(file);
        };
        img.onerror = () => {
            setError('Invalid image file.');
            URL.revokeObjectURL(img.src);
        };
    };

    const handleTeamNameChange = (value: string | number) => {
        setTeamInfo((prevState) => ({
            ...prevState,
            teamName: value as string,
            _isDirty: true,
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamInfo.teamName || !teamInfo.teamPicture) {
            setError('Please fill out all required fields.');
            return;
        }
        setIsCreating(true);
        setError(null);

        try {
            const newTeam = await createTeam.mutateAsync({
                hackathonId,
                name: teamInfo.teamName,
                teamPictureUrl: teamInfo.teamPicture,
            });

            if (!newTeam) {
                setError('Failed to create team. Please try again.');
            }

            toast({
                title: 'Team created!',
                description: `Your team ${newTeam.name} was successfuly created.`,
                variant: 'default',
                icon: <UserGroupIcon />,
            });
            router.push(`/team`);
        } catch (err) {
            setError('Failed to create team. Please try again.');
            setIsCreating(false);
        }
    };

    // Form shared between Dialog and Drawer
    const FormContent = (
        <form className="flex flex-col gap-8">
            {error && (
                <Alert variant={'warning'}>
                    <AlertTitle>Image upload failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex gap-6 text-white/60">
                <Image
                    src={teamInfo.teamPicture || '/teams/default.webp'}
                    alt="Team picture"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-xl"
                />
                <Conditional showWhen={isDesktop}>
                    <div className="flex flex-col gap-3">
                        <label className="block text-sm font-medium">
                            Team picture *
                        </label>
                        <Input
                            type="file"
                            id="file-upload"
                            className="hidden w-auto"
                            accept=".png, .jpeg"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            required
                            disabled={isCreating}
                        />
                        <div className="flex gap-1">
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer"
                            >
                                <Button
                                    variant="default"
                                    hierarchy="primary"
                                    size="compact"
                                    onClick={handleButtonClick}
                                    type="button"
                                    disabled={isCreating}
                                >
                                    Upload
                                </Button>
                            </label>
                            {teamInfo.teamPicture && (
                                <Button
                                    variant="default"
                                    hierarchy="tertiary"
                                    size="compact"
                                    className="hover:bg-neutral-750/60 border-2 border-transparent underline underline-offset-4"
                                    onClick={() => {
                                        setTeamInfo((prevState) => ({
                                            ...prevState,
                                            teamPicture: '',
                                        }));
                                    }}
                                    type="button"
                                    disabled={isCreating}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                        <p className="text-xs">
                            .png, jpeg files up to 2 MB <br /> At least 200px x
                            200px
                        </p>
                    </div>
                </Conditional>
                <Conditional showWhen={!isDesktop}>
                    <div className="flex flex-col gap-3">
                        <label className="block text-sm font-medium">
                            Team picture *
                        </label>
                        <Input
                            type="file"
                            id="file-upload"
                            className="hidden w-auto"
                            accept=".png, .jpeg"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            required
                            disabled={isCreating}
                        />
                        <p className="text-xs">
                            .png, jpeg files up to 2 MB <br /> At least 200px x
                            200px
                        </p>
                    </div>
                    <div className="flex flex-col items-end justify-end gap-1">
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <Button
                                variant="default"
                                hierarchy="primary"
                                size="compact"
                                onClick={handleButtonClick}
                                type="button"
                                disabled={isCreating}
                            >
                                Upload
                            </Button>
                        </label>
                    </div>
                </Conditional>
            </div>

            <div className="flex flex-col gap-3">
                <label
                    htmlFor="teamName"
                    className="text-sm font-medium text-white/60"
                >
                    Team name *
                </label>
                <FormTextInput
                    type="search"
                    name="teamName"
                    lazy
                    defaultValue={teamInfo.teamName}
                    onLazyChange={handleTeamNameChange}
                    required
                    maxLength={25}
                    placeholder="Enter team name"
                    errorMsg={errorMsg}
                    disabled={isCreating}
                />
            </div>
        </form>
    );

    return (
        <ResponsiveDialogContent>
            <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Create new team</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                    Help organizers identify your team with a name and icon. Be
                    warned – this information can&apos;t be changed.
                </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>

            {FormContent}

            <ResponsiveDialogFooter className="grid grid-cols-2 gap-3">
                <ResponsiveDialogClose asChild>
                    <Button
                        variant="default"
                        size="cozy"
                        hierarchy="secondary"
                        type="button"
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                </ResponsiveDialogClose>
                <Button
                    type="submit"
                    variant="brand"
                    size="cozy"
                    hierarchy="primary"
                    disabled={disabled || isCreating}
                    onClick={handleFormSubmit}
                >
                    {isCreating ? 'Creating...' : 'Create team'}
                </Button>
            </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
    );
}
