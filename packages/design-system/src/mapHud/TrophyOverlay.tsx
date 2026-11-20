import type { ComponentType, ReactNode } from 'react';
import { ScrollView, styled, Text, View } from 'tamagui';
import { type AssetImageProps, useAssetImage } from '../assetImage';
import { verticalGradient } from '../palette';

const phoneCardWidth: number = 371;

const tabletCardWidth: number = 620;

const phoneTrophySize: number = 226;

const tabletTrophySize: number = 378;

const cloudsAspectRatio: number = 371 / 201;

type TrophyOverlayProps = {
  score: number;
  children: ReactNode;
  actions: ReactNode;
};

const Scrim = styled(View, {
  position: 'absolute',
  t: '0',
  r: '0',
  b: '0',
  l: '0',
  bg: 'scrim',
});

const SafeArea = styled(View, {
  grow: 1,
  pt: 'safe',
  px: 'safe',
  pb: 'safe',
});

const CenteredColumn = styled(View, {
  grow: 1,
  items: 'center',
  justify: 'center',
  p: '4 md:8',
});

const CardSlot = styled(View, {
  w: '100%',
  maxW: `${phoneCardWidth}px md:${tabletCardWidth}px`,
  pt: '20 md:36',
});

const Card = styled(View, {
  position: 'relative',
  pt: '20 md:32',
  pb: '1.5 md:2.5',
  rounded: '3xl md:11',
  backgroundImage: verticalGradient('night'),
  boxShadow: 'trophy-card md:trophy-card-tablet',
});

const Clouds = styled(View, {
  position: 'absolute',
  t: '0',
  r: '0',
  l: '0',
  aspectRatio: cloudsAspectRatio,
  overflow: 'hidden',
  borderTopLeftRadius: '3xl md:11',
  borderTopRightRadius: '3xl md:11',
  pointerEvents: 'none',
});

const CloudsImage = styled(View, {
  position: 'absolute',
  t: '-72.64%',
  l: '-6.78%',
  w: '113.57%',
  h: '172.56%',
  opacity: 0.59,
});

const CloudsFade = styled(View, {
  position: 'absolute',
  t: '0',
  r: '0',
  b: '0',
  l: '0',
  backgroundImage: verticalGradient('clouds-fade'),
});

const TrophySlot = styled(View, {
  position: 'absolute',
  t: '-20 md:-36',
  r: '0',
  l: '0',
  items: 'center',
  pointerEvents: 'none',
});

const Trophy = styled(View, {
  w: `${phoneTrophySize}px md:${tabletTrophySize}px`,
  h: `${phoneTrophySize}px md:${tabletTrophySize}px`,
});

const ScorePill = styled(View, {
  position: 'relative',
  self: 'center',
  px: '3 md:5',
  py: '2.5 md:3.5',
  rounded: '3xl md:11',
  backgroundImage: verticalGradient('orange'),
  boxShadow: 'score-pill md:score-pill-tablet',
});

const Score = styled(Text, {
  fontFamily: 'heading',
  fontSize: '11 md:13',
  lineHeight: '11 md:13',
  fontWeight: '700',
  color: 'white',
  text: 'center',
});

const ScoreUnit = styled(Text, {
  fontFamily: 'heading',
  fontSize: '8 md:11',
  lineHeight: '8 md:11',
  fontWeight: '700',
  color: 'score-pill-unit',
});

const Body = styled(View, {
  position: 'relative',
  gap: '5 md:8',
  mt: '5 md:8',
  px: '1.5 md:2.5',
});

const Actions = styled(View, {
  position: 'relative',
  gap: '1 md:2',
  mt: '5 md:9',
  px: '2 md:3',
});

export function TrophyOverlay({
  score,
  children,
  actions,
}: TrophyOverlayProps) {
  const AssetImage: ComponentType<AssetImageProps> = useAssetImage();

  return (
    <Scrim>
      <ScrollView
        flex={1}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <SafeArea>
          <CenteredColumn>
            <CardSlot>
              <Card>
                <Clouds>
                  <CloudsImage>
                    <AssetImage asset="decorations/clouds" />
                  </CloudsImage>
                  <CloudsFade />
                </Clouds>
                <TrophySlot>
                  <Trophy>
                    <AssetImage asset="decorations/trophy" />
                  </Trophy>
                </TrophySlot>
                <ScorePill role="status">
                  <Score>
                    {score}
                    <ScoreUnit>pts</ScoreUnit>
                  </Score>
                </ScorePill>
                <Body>{children}</Body>
                <Actions>{actions}</Actions>
              </Card>
            </CardSlot>
          </CenteredColumn>
        </SafeArea>
      </ScrollView>
    </Scrim>
  );
}
