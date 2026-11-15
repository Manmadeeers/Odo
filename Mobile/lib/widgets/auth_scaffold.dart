import 'package:flutter/material.dart';

import '../theme/odo_theme.dart';

class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    required this.description,
    required this.child,
    this.eyebrow,
    this.footer,
    this.showBack = true,
  });

  final String? eyebrow;
  final String title;
  final String description;
  final Widget child;
  final Widget? footer;
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _StoryHeader(showBack: showBack)),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 34, 24, 36),
              sliver: SliverToBoxAdapter(
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 520),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (eyebrow != null) Eyebrow(eyebrow!),
                        Text(
                          title,
                          style: Theme.of(context).textTheme.displaySmall,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          description,
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                        const SizedBox(height: 26),
                        child,
                        if (footer != null) ...[
                          const SizedBox(height: 28),
                          const Divider(color: OdoColors.line),
                          const SizedBox(height: 14),
                          Center(child: footer!),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StoryHeader extends StatelessWidget {
  const _StoryHeader({required this.showBack});

  final bool showBack;

  @override
  Widget build(BuildContext context) {
    final canPop = Navigator.of(context).canPop();
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [OdoColors.forest, OdoColors.forestDeep],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(18, 14, 24, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (showBack && canPop)
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  color: Colors.white,
                  tooltip: 'Back',
                  icon: const Icon(Icons.arrow_back_rounded),
                )
              else
                const SizedBox(width: 48),
              const Spacer(),
              const OdoBrand(light: true),
            ],
          ),
          const SizedBox(height: 28),
          const Padding(
            padding: EdgeInsets.only(left: 6),
            child: Text(
              'RIDE. REMEMBER. REPEAT.',
              style: TextStyle(
                color: OdoColors.lime,
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.7,
              ),
            ),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.only(left: 6),
            child: Text(
              'Every kilometre tells part of your story.',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                height: 1.12,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.7,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class OdoBrand extends StatelessWidget {
  const OdoBrand({super.key, this.light = false});

  final bool light;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 31,
          height: 31,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: OdoColors.lime, width: 6),
          ),
        ),
        const SizedBox(width: 9),
        Text(
          'Odo',
          style: TextStyle(
            color: light ? Colors.white : OdoColors.ink,
            fontSize: 21,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.8,
          ),
        ),
      ],
    );
  }
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          color: OdoColors.success,
          fontSize: 11,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.6,
        ),
      ),
    );
  }
}
