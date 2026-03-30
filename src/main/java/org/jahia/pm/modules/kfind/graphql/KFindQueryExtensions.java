package org.jahia.pm.modules.kfind.graphql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;
import org.jahia.modules.graphql.provider.dxm.node.GqlJcrNode;
import org.jahia.modules.graphql.provider.dxm.node.GqlJcrNodeImpl;
import org.jahia.osgi.BundleUtils;
import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.content.JCRSessionFactory;
import org.jahia.services.content.JCRSessionWrapper;
import org.jahia.services.render.URLResolver;
import org.jahia.services.render.URLResolverFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Extends the Jahia GraphQL Query type with a {@code urlReverseLookup} field.
 * <p>
 * Given a live website URL, this extension resolves matching JCR nodes by:
 * <ol>
 * <li>Parsing the URL path</li>
 * <li>Building candidate paths (raw, /sites/{siteKey}+path,
 * /sites/{siteKey}/home+path)</li>
 * <li>Resolving each candidate via {@link URLResolverFactory}</li>
 * <li>Returning all distinct resolved nodes</li>
 * </ol>
 */
@GraphQLTypeExtension(DXGraphQLProvider.Query.class)
@GraphQLDescription("kfind URL reverse lookup extension")
public class KFindQueryExtensions {

    private static final Logger logger = LoggerFactory.getLogger(KFindQueryExtensions.class);

    private static final Pattern SITE_KEY_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+$");

    /**
     * Resolve a live website URL to all matching JCR nodes.
     *
     * @param url     the full URL or path fragment to look up
     * @param siteKey the Jahia site key to scope the search
     * @return a list of matching GqlJcrNode instances (may be empty)
     */
    @GraphQLField
    @GraphQLName("urlReverseLookup")
    @GraphQLDescription("Resolve a live website URL to its JCR nodes via vanity URL or direct path matching")
    public static List<GqlJcrNode> urlReverseLookup(
            @GraphQLNonNull @GraphQLName("url") @GraphQLDescription("The URL or path to look up") String url,
            @GraphQLNonNull @GraphQLName("siteKey") @GraphQLDescription("The Jahia site key") String siteKey) {
        logger.debug("[urlReverseLookup] START — url='{}' siteKey='{}'", url, siteKey);

        if (!SITE_KEY_PATTERN.matcher(siteKey).matches()) {
            logger.debug("[urlReverseLookup] Rejected — siteKey '{}' fails validation pattern", siteKey);
            throw new IllegalArgumentException("Invalid site key: " + siteKey);
        }

        try {
            JCRSessionWrapper session = JCRSessionFactory.getInstance()
                    .getCurrentUserSession("default");
            String workspace = session.getWorkspace().getName();

            String path = extractPath(url);
            logger.debug("[urlReverseLookup] extractPath('{}') => '{}'", url, path);

            List<GqlJcrNode> results = new ArrayList<>();
            Set<String> seenPaths = new LinkedHashSet<>();

            for (String candidate : buildServiceCandidates(path, siteKey)) {
                GqlJcrNode resolved = resolveWithUrlResolver(candidate, siteKey, workspace);
                if (resolved != null) {
                    String nodePath = resolved.getPath();
                    if (seenPaths.add(nodePath)) {
                        logger.debug("[urlReverseLookup] Resolved via URLResolver at candidate='{}' → node='{}'",
                                candidate, nodePath);
                        results.add(resolved);
                    }
                }
            }

            logger.debug("[urlReverseLookup] END — {} node(s) found for url='{}'", results.size(), url);
            return results;
        } catch (RepositoryException e) {
            logger.debug("[urlReverseLookup] RepositoryException for url='{}': {}", url, e.getMessage(), e);
            throw new RuntimeException("Error during URL reverse lookup: " + e.getMessage(), e);
        }
    }

    /**
     * Extracts the path from a URL string. Handles both full URLs and plain paths.
     */
    private static String extractPath(String url) {
        logger.debug("[extractPath] input='{}'", url);

        if (url == null || url.isEmpty()) {
            logger.debug("[extractPath] input is null or empty — returning '/'");
            return "/";
        }

        try {
            if (url.startsWith("http://") || url.startsWith("https://")) {
                logger.debug("[extractPath] detected full URL scheme, parsing with URI");
                URI uri = URI.create(url);
                logger.debug("[extractPath] URI parsed — scheme='{}' host='{}' path='{}' query='{}' fragment='{}'",
                        uri.getScheme(), uri.getHost(), uri.getPath(), uri.getQuery(), uri.getFragment());
                String path = uri.getPath();
                if (path == null || path.isEmpty()) {
                    logger.debug("[extractPath] URI path is null/empty — returning '/'");
                    return "/";
                }
                logger.debug("[extractPath] extracted path from full URL: '{}'", path);
                return path;
            }
        } catch (IllegalArgumentException e) {
            // Not a valid URI — treat as a path
            logger.debug("[extractPath] URI.create failed for '{}' — treating as plain path: {}", url, e.getMessage());
        }

        String result = url.startsWith("/") ? url : "/" + url;
        logger.debug("[extractPath] treating as plain path — result='{}'", result);
        return result;
    }

    private static Set<String> buildServiceCandidates(String rawPath, String siteKey) {
        String siteRoot = "/sites/" + siteKey;
        List<String> generatedCandidates = new ArrayList<>();

        generatedCandidates.add(rawPath);
        generatedCandidates.add(siteRoot + rawPath);
        generatedCandidates.add(siteRoot + "/home" + rawPath);

        Set<String> candidates = new LinkedHashSet<>();
        List<String> duplicates = new ArrayList<>();
        for (String candidate : generatedCandidates) {
            String normalized = normalizeCandidatePath(candidate);
            if (!candidates.add(normalized)) {
                duplicates.add(normalized);
            }
        }

        if (!duplicates.isEmpty()) {
            logger.debug("[buildServiceCandidates] removed duplicate candidate(s): {}", duplicates);
        }
        logger.debug("[buildServiceCandidates] {} candidate(s): {}", candidates.size(), candidates);
        return candidates;
    }

    private static String normalizeCandidatePath(String candidate) {
        if (candidate == null || candidate.isEmpty()) {
            return "/";
        }

        String normalized = candidate.startsWith("/") ? candidate : "/" + candidate;
        if (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private static GqlJcrNode resolveWithUrlResolver(String path, String siteKey, String workspace) {
        logger.debug("[resolveWithUrlResolver] path='{}' siteKey='{}' workspace='{}'", path, siteKey, workspace);

        URLResolverFactory urlResolverFactory = BundleUtils.getOsgiService(URLResolverFactory.class, null);
        if (urlResolverFactory == null) {
            logger.debug("[resolveWithUrlResolver] URLResolverFactory OSGi service unavailable");
            return null;
        }

        try {
            URLResolver resolver = urlResolverFactory.createURLResolver(path, siteKey, workspace, null);
            resolver.setSiteKey(siteKey);
            JCRNodeWrapper node = resolver.getNode();
            if (node != null) {
                logger.debug("[resolveWithUrlResolver] resolved node — path='{}' type='{}'",
                        node.getPath(), node.getPrimaryNodeType().getName());
                return new GqlJcrNodeImpl(node);
            }
        } catch (RepositoryException e) {
            logger.debug("[resolveWithUrlResolver] RepositoryException while resolving path='{}'", path, e);
        } catch (RuntimeException e) {
            logger.debug("[resolveWithUrlResolver] RuntimeException while resolving path='{}'", path, e);
        }

        logger.debug("[resolveWithUrlResolver] returning null for path='{}'", path);
        return null;
    }
}
